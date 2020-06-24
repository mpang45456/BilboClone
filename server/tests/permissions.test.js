const { PERMS, PermissionsTransformer } = require('../routes/api/v1/auth/permissions');
const { expect } = require('chai');

describe('Testing Permissions Management', () => {
    const pt = new PermissionsTransformer();
    
    it('Encoded permission string should have correct order', (done) => {
        let permString = pt.encode([PERMS.SALES_READ, PERMS.SALES_WRITE]);
        expect(permString[0]).to.equal('1');
        expect(permString[1]).to.equal('1');
        expect(permString[2]).to.equal('0');
        expect(permString[3]).to.equal('0');

        permString = pt.encode([PERMS.SALES_READ, PERMS.PURCHASES_WRITE]);
        expect(permString[0]).to.equal('1');
        expect(permString[1]).to.equal('0');
        expect(permString[2]).to.equal('0');
        expect(permString[3]).to.equal('1');
        
        done();
    })

    it('Encoding of permissions string should throw error for invalid permission', (done) => {
        expect(() => pt.encode('SALES_RAED')).to.throw(Error);
        expect(() => pt.encode(['SALES_RAED', PERMS.SALES_WRITE])).to.throw(Error);

        done();
    })

    it('Decoding of permission string should yield correct permissions', (done) => {
        let permString = '1100';
        let permList = pt.decode(permString);
        expect(permList).to.be.an('array');
        expect(permList).to.include(PERMS.SALES_READ);
        expect(permList).to.include(PERMS.SALES_WRITE);
        expect(permList).to.not.include(PERMS.PURCHASES_READ);
        expect(permList).to.not.include(PERMS.PURCHASES_WRITE);

        permString = '1001';
        permList = pt.decode(permString);
        expect(permList).to.be.an('array');
        expect(permList).to.include(PERMS.SALES_READ);
        expect(permList).to.not.include(PERMS.SALES_WRITE);
        expect(permList).to.not.include(PERMS.PURCHASES_READ);
        expect(permList).to.include(PERMS.PURCHASES_WRITE);
        
        done();
    })

    it('Check for valid permissions', (done) => {
        let perms = [PERMS.SALES_WRITE, PERMS.PURCHASES_WRITE];
        expect(pt.isValidPermissions(perms)).to.be.true;

        done();
    })

    it('Check for invalid permissions', (done) => {
        let perms = ['SALES_RAED', PERMS.PURCHASES_WRITE];
        expect(pt.isValidPermissions(perms)).to.be.false;

        done();
    })
})