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