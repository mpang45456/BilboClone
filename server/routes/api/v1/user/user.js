const express = require('express');
const router = express.Router();

const logger = require('../../../../utils');
const { UserModel } = require('../../../../data/database');
const { isAuthenticated, isAuthorized } = require('../auth/auth');
const { PERMS } = require('../auth/permissions');

// Router Set-Up
router.use(isAuthenticated);

/**
 * Mounted: /api/v1/user
 * 
 * Creates a NEW user. Request body must contain
 * username, password, permissions, name and position (JSON). 
 */
router.post('/',
            isAuthorized(PERMS.USER_WRITE), 
            function(req, res) {
    const { username, password, permissions, name, position, reportsTo } = req.body;
    let newUser = null;
    try {
        newUser = new UserModel({ username,
                                  permissions, 
                                  name, 
                                  position,
                                  reportsTo });
        newUser.setPassword(password);
    } catch(error) {
        logger.error(`/user: Could not create newUser: ${error}`);
        return res.status(400).send("Unable to create new user");
    }

    newUser.save(function(error, newUser) {
        if (error) {
            logger.error(`/user: Could not save newUser: ${error}`);
            // console.error(error);
            return res.status(400).send("Unable to create new user");
        }
        return res.status(200).send("Successfully created new user: " + username);
    });
})

/**
 * Mounted: /api/v1/user/:username
 * 
 * Patches the fields (password, permissions, name
 * position) of a user. The username cannot be changed.
 */
router.patch('/:username', 
             isAuthorized(PERMS.USER_WRITE), 
             function(req, res) {
    const username = req.params.username;
    const { oldPassword, newPassword, permissions, name , position, reportsTo } = req.body;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) { return res.status(500).send("Oops, something went wrong"); }
        if (!user) { return res.status(400).send("User does not exist"); }

        if (newPassword) { 
            if (!user.isValidPassword(oldPassword)) {
                return res.status(400).send("Incorrect credentials");
            }
            user.setPassword(newPassword); 
        }
        if (permissions) { user.permissions = permissions; }
        if (name) { user.name = name; }
        if (position) { user.position = position; }
        if (reportsTo) { user.reportsTo = reportsTo; }

        user.save()
            .then(() => res.status(200).send("Updated User Details"))
            .catch((error) => logger.error(`/user/:username: ${error}`));
    })
})

/**
 * Mounted: /api/v1/user/:username
 * 
 * Deletes the user `:username`. If `:username`
 * does not exist in the database, a success status
 * is still sent (because the outcome of a DELETE 
 * request is to make sure the resource does not exist
 * at the end of a request)
 */
router.delete('/:username', 
              isAuthorized(PERMS.USER_WRITE), 
              function(req, res) {
    const username = req.params.username;

    UserModel.deleteOne({ username: username }, function(err) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        res.status(200).send("Deleted User");
    })
})

/**
 * Mounted: /api/v1/user
 * 
 * Gets the collection of users (returns as JSON)
 * 
 * Note: JSON Format: 
 * [
 *      {
 *          "username": username
 *          "role": role
 *      }
 *      ...
 * ]
 * 
 * // TODO: Can add query parameters to filter
 * the fields that are returned
 */
router.get('/', 
           isAuthorized(PERMS.USER_READ), 
           function(req, res) {
    let ret = [];

    UserModel.find({}, function(err, users) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        users.forEach(user => {
            ret.push({ username: user.username, 
                       permissions: user.permissions,
                       name: user.name,
                       position: user.position
            });
        })
        res.status(200).json(ret);
    })
})

/**
 * Mounted: /api/v1/user
 * 
 * Gets the user (`:username`) (returns as JSON)
 * 
 * Note: JSON Format: 
 * {
 *      "username": username,
 *      "role": role
 * }
 */
router.get('/:username', 
           isAuthorized(PERMS.USER_READ), 
           function(req, res) {
    const username = req.params.username;

    UserModel.findOne({ username: username }, function(err, user) {
        if (err) {
            return res.status(500).send("Oops, something went wrong");
        }

        if (!user) {
            return res.status(400).send("User does not exist");
        }

        res.status(200).json({ username: username, 
                               permissions: user.permissions,
                               name: user.name, 
                               position: user.position 
        });
    })
})

module.exports = {
    userRouter: router
}