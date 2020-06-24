const { UserModel } = require('../../../../data/database');

class UserHierarchy {
    constructor() {
        // FIXME: Necessary?
    }

    static async getAllDirectDescendents(username) {
        // Check if user `username` exists
        let user = await UserModel.findOne({ username });
        if (!user) {
            throw new Error(`Cannot find direct descendents. No such user: ${username}`);
        }

        // Find direct descendents
        let users = await UserModel.find({ reportsTo: username })
        return users.map(user => user.username);
    }

    static async getAllDescendents(username) {
        let descendents = []; // Stores usernames only
        let stack = [];
        const rootUser = await UserModel.findOne({ username });

        if (!rootUser) {
            throw new Error(`Cannot find all descendents. No such user: ${username}`);
        }

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
    }
}

module.exports = {
    UserHierarchy
}