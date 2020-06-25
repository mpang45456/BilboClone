/*
Instructions for adding permissions:
1. Add a new entry in the `PERMS` object. (should 
    add at the end of the object)
2. Make sure that the field's key and value match
    (no typos!)
3. Head over to the server endpoint and add an
    `isAuthorized` middleware to the endpoint 
    with the newly added permission
*/

// Object Property Order is preserved for non-integer keys
// Care must be taken to ensure that the key corresponds to the value
const PERMS = Object.freeze({
    SALES_READ: 'SALES_READ', // TODO: Add descriptions
    SALES_WRITE: 'SALES_WRITE',
    PURCHASES_READ: 'PURCHASES_READ',
    PURCHASES_WRITE: 'PURCHASES_WRITE', // TODO: Add more perms
    USER_READ: 'USER_READ',
    USER_WRITE: 'USER_WRITE',
    SUPPLIER_READ: 'SUPPLIER_READ',
    SUPPLIER_WRITE: 'SUPPLIER_WRITE',
    CUSTOMER_READ: 'CUSTOMER_READ',
    CUSTOMER_WRITE: 'CUSTOMER_WRITE',
    INVENTORY_READ: 'INVENTORY_READ',
    STATISTICS_READ: 'STATISTICS_READ'
})

/**
 * Helps manage the encoding and decoding of 
 * Permissions (ensures validity). 
 * 
 * Note: Permissions are always stored and managed
 * as an array of Strings (the actual string itself, 
 * not the bit string). The only time the permissions
 * are converted into bit strings is for storage in
 * the JWT (this is for efficiency purposes, so that 
 * a potentially large number of permissions will not
 * bloat the JWT).
 * 
 * In other words:
 * - In JWT: permissions ==> '110001;
 * - Elsewhere: permissions ==> ['SALES_READ', 'USER_READ' ...]
 */
class PermissionsTransformer {
    constructor() {
        this.totalNumPerms = Object.keys(PERMS).length;
    }

    /**
     * Takes an array of permissions (e.g. 'SALES_READ')
     * and converts it into a bit string (e.g. '110001')
     * @param {[String]} perms 
     */
    encode(perms) {
        // Start with all permissions off
        let encodedString = '0'.repeat(this.totalNumPerms);

        for (let perm of perms) {
            if (!this.__isValidPermission(perm)) {
                throw new Error(`Invalid Permission Type: ${perm}`);
            }
            
            let index = this.__getPermIndex(perm);
            encodedString = encodedString.substring(0, index) 
                            + '1' 
                            + encodedString.substring(index+1); //Flip the permission bit on
        }

        return encodedString;
    }

    /**
     * Checks whether each of the permissions in `perm`
     * is a permission in `PERMS` (no typos, no permissions
     * that were not explicitly defined in `PERMS`)
     * @param {[String]} perms 
     */
    isValidPermissions(perms) {
        return perms.every(this.__isValidPermission);
    }

    /**
     * Checks if the individual `perm` is valid
     * @param {String} perm 
     */
    __isValidPermission(perm) {
        return Object.keys(PERMS).includes(perm);
    }

    /**
     * Obtains the index of `perm` in `PERMS`
     * @param {String} perm 
     */
    __getPermIndex(perm) {
        return Object.keys(PERMS).indexOf(perm);
    }

    /**
     * Converts the bit string `permString` (e.g. '101001')
     * into an array of permissions (e.g. ['SALES_READ' ...])
     * @param {String} permString 
     */
    decode(permString) {
        let PERMS_ARRAY = Object.keys(PERMS);
        let setPerms = [];
        for (let i = 0; i < permString.length; i++) {
            if (permString[i] == '1') {
                setPerms.push(PERMS_ARRAY[i]);
            }
        }

        return setPerms;
    }
}

module.exports = {
    PERMS,
    PermissionsTransformer
}