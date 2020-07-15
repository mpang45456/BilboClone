const { UserModel } = require('../../../../data/database');

/**
 * Helper class to obtain the organisational
 * hierarchy of users. Interacts with the `User`
 * collection in the database.
 */
class UserHierarchy {
    /**
     * Returns an array of direct reports of the given user.
     * The array does not include `username` itself (i.e.
     * strictly just the descendents of the node)
     * 
     * Note that the user is identified by their username
     * and not by the any other ID (e.g. ObjectID in MongoDB).
     * @param {String} username 
     */
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

    /**
     * Returns an array of all reports of the given user (not
     * just the direct children)
     * The array does not include `username` itself. 
     * @param {String} username 
     */
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

/**
 * Obtains the user hierarchy (inclusive of the user)
 * and sets it in `req.userHierarchy`.
 * 
 * Note: This middleware must be uesd AFTER the
 * `isAuthenticated` middleware (because it relies on
 * `isAuthenticated` to set `req.user` first)
 */
async function setUserHierarchy(req, res, next) {
    try {
        req.userHierarchy = await UserHierarchy.getAllDescendents(req.user.username);
        req.userHierarchy.push(req.user.username);
    } catch(err) {
        return res.status(500).send("Ooops, something went wrong");
    }
    next();
}

module.exports = {
    UserHierarchy,
    setUserHierarchy,
}