# Bilbo
Business Management Platform for Industrial SMEs

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
3. End-To-End Testing
    - This uses Cypress and is meant to test application flows
    - 2 commands must be run to get this started:
        - (1) `npm run cypress:start-test-server`
            - This will reset the database (but only once at the start, 
            so care must still be taken to prevent side-effects)
            - This is an end-to-end test, so an actual database that persists
            changes based on interactions in the user interface is necessary.
            The reset at the start is just to ensure that each separate
            run of the tests starts from the same state, making behaviour
            more predictable.
        - (2) `npm run cypress:open`

Note:
For both Server-Side Testing and End-To-End Testing, the PORT number and
NODE_ENV and explicitly set in the npm script. 

The PORT number is unique (different from the dev server's PORT number), 
so tests and the dev server can run concurrently. The NODE_ENV is set to
`test` to ensure that any database changes will not affect data for `dev`.

# Running the Dev Server
While developing, there may be an occasion where a reset of the database
to a pre-defined state is necessary.

If so, set the `RESET_DB=true` environment variable, like so:
`RESET_DB=true npm run start-dev`
