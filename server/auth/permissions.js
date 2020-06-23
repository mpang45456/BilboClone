// Object Property Order is preserved for non-integer keys
// Care must be taken to ensure that the key corresponds to the value
const PERMS = Object.freeze({
    SALES_READ: 'SALES_READ', // TODO: Add descriptions
    SALES_WRITE: 'SALES_WRITE',
    PURCHASES_READ: 'PURCHASES_READ',
    PURCHASES_WRITE: 'PURCHASES_WRITE', // TODO: Add more perms
})

class PermissionsManager {
    constructor() {
        this.totalNumPerms = Object.keys(PERMS).length;
    }

    // [PERMS.SALES_READ]
    encode(perms) {
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

    isValidPermissions(perms) {
        return perms.every(this.__isValidPermission);
    }

    __isValidPermission(perm) {
        return Object.keys(PERMS).includes(perm);
    }

    __getPermIndex(perm) {
        return Object.keys(PERMS).indexOf(perm);
    }

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
    PermissionsManager
}




// authorize([PERMS.SALES_READ, PERMS.SALES_WRITE])