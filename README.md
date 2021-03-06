# Bilbo
Business Management Platform for Industrial SMEs

# Installation
1. Clone this repo
2. Ensure that you have `node` and `npm` installed.
   Bilbo was developed using `node` v14.3.0 and `npm`
   v6.14.5. It is recommended to use `nvm` for installation.
3. Navigate to `bilbo` folder
4. Install dependencies by running `npm install`
5. Make folder for database store: `mkdir -p ./server/data/db`
6. Make sure you have MongoDB installed. Refer to [this](https://docs.mongodb.com/guides/server/install/) for installation instructions. 
7. Start MongoDB daemon: `npm run mongod`
8. Start dev server (and reset database): `RESET_DB=true npm run start-dev`
9. Start hot reloading react app: `npm run react-start`
   - Alternatively, you could build the react app to get a production-ready
     version by first running `npm run react-build`. Once this is done, 
     the react app can be accessible at `http://localhost:3000`.
10. Start using/developing!


# Styling 
## Application-Wide Custom Theme Management:
This is achieved by modifying the less variables in `webpack.config.js`
This modifies what Ant-Design looks like.

## Component-Specific Theme Management
This achieved by using `styled-components`.

Strategies:
- Use `styled-components` ThemeProvider. In each styled component, 
you can access the theme through `props.theme`
- Create a wrapper styled component that specifies the css properties
for child classes. This is more specific than the default ant-design
properties, causing an override. (See `Wrapper` in `LoginPage.js`)

```
const Wrapper = styled.div`
    padding: 2em;
    width: 30%;
    background: ${props => props.theme.colors.marble};
    position: absolute;
    left: 50%;
    top: 50%;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);

    min-width: 300px;
    max-width: 450px;

    .ant-btn-primary {
        border: 2px solid ${props => props.theme.colors.powderPink };
        background: ${props => props.theme.colors.powderPink};
        color: ${props => props.theme.colors.deepRed };
    }
`;
```

- Style an ant-design component directly using `style` from
`style-components` module. (See `DarkInvertedStyledButton` in
`UtilComponents.js`)


# Testing Strategies
There are 3 main testing strategies used in Bilbo: 
1. Client-Side Testing (Unit + Integration Tests)
    - These test the React Components and how they interface/work together
    - //FIXME: Not Yet Implemented
2. Server-Side Testing
    - This tests the backend APIs
    - Found in `server/tests`
    - Run using `npm run test-server`
    - `PORT=8002 NODE_ENV=test LOG_LEVEL=silent`
    - When writing server-side API tests, it is best to avoid assumptions
    of the existing database (there can be side-effects from previous tests)
    and to use the before/after hooks to perform setup/teardown instead. Always
    clear the database's collections before/after each test.
    - Can run concurrently with dev server (because of different port
    number: 8002)
    - To run a specific test file: `npm run test-server -- -i <file_name>`
3. End-To-End Testing
    - This uses Cypress and is meant to test application flows
    - 3 commands must be run to get this started:
        - (0) `npm run react-build`
            - You must first get the most updated version of the React
            SPA. Otherwise, the e2e tests will run using outdated versions.
        - (1) `npm run cypress:start-test-server`
            - This will reset the database (but only once at the start, 
            so care must still be taken to prevent side-effects)
            - This is an end-to-end test, so an actual database that persists
            changes based on interactions in the user interface is necessary.
            The reset at the start is just to ensure that each separate
            run of the tests starts from the same state, making behaviour
            more predictable.
            - Can run concurrently with dev server (because of different
            port number: 8001)
        - (2) `npm run cypress:open`
            - Alternatively, `npx cypress run --browser chrome` for CLI tests

Note:
For both Server-Side Testing and End-To-End Testing, the PORT number and
NODE_ENV are explicitly set in the npm script. 

The PORT number is unique (different from the dev server's PORT number), 
so tests and the dev server can run concurrently. The NODE_ENV is set to
`test` to ensure that any database changes will not affect data for `dev`.

# Development
## Client-Side Development
1. Start MongoDB
    - `npm run mongod`
2. Start Dev Server
    - `npm run start-dev`
3. Start Webpack Dev Server (updates React SPA dynamically)
    - `npm run react-start`. The `devServer` settings in
    `webpack.config.js` proxy any calls to `/api` to `localhost:3000`

To test actual built React SPA, remember to first build the React
application: `npm run react-build`, then run the Dev Server.

## Resetting Development Database
While developing, there may be an occasion where a reset of the database
to a pre-defined state is necessary. The pre-defined state is as defined 
in `server/data/databaseBootstrap`, which defines the seed values for
the database.

If resetting, set the `RESET_DB=true` environment variable, like so:
`RESET_DB=true npm run start-dev`

## Development Practices
Steps for Creating Custom Components
1. Check for Authorization First. Redirect if unauthorized 
using CONFIG.<ERROR_URL>
2. Use useEffect() hook (if function component) or lifecycle 
methods (if class component) to make API calls if necessary
3. Plan the use of components. If possible, re-use components
in `UtilComponents.js`
4. Add type-checking to all props used. Destructure all props
to make explicit what props are necessary for the component 
to work

# Use of Environment Variables
`PORT`: Specifies the Port Number the server connects to
`RESET_DB`: Specifies whether or not to reset the database
`NODE_ENV`: Specifies the node environment, which in turn determines which database to connect to (i.e. the `dev`, `test` and eventually, `prod` databases
are all siloed)
`LOG_LEVEL`: Specifies the logging level for `pino` loggger. See `server/utils.js`

## Specific to `cypress:reset_db`
`RESET_DB_ALL`: Resets all collections in the `test` database (because `NODE_ENV` is set to `test` in the npm script, see `package.json`)
`RESET_DB_USERS`: Resets user collection
... and so on