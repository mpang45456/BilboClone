const { UserModel } = require('../../../../data/database');

class UserHierarchyManager {
    constructor() {
        // FIXME: Necessary?
    }

    getAllDirectDescendents(username) {
        UserModel.find({ reportsTo: username }, function(err, users) {
            if (err) { throw new Error(err); }
            return users.map(user => user.username);
        })
    }

    async getAllDescendents(username) {
        let descendents = []; // Stores usernames only
        let stack = [];
        try {
            const rootUser = await UserModel.findOne({ username });
            stack.push(rootUser);

            while (stack.length > 0) {
                let currUser = stack.pop();
                let children = await UserModel.find({ reportsTo: currUser.username });
                for (let child of children) {
                    descendents.push(child.username);
                    stack.push(child);
                }
            }

            return descendents;
        } catch(error) {
            // The try-catch clause is not absolutely necessary, 
            // but makes explicit that any problems with the db
            // access code may possibly throw an error
            throw new Error(err);
        }
    }
}

module.exports = {
    UserHierarchyManager
}