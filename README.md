# Bilbo
Business Management Platform for Industrial SMEs

# Styling 
## Application-Wide Custom Theme Management:
This is achieved by modifying the less variables in `webpack.config.js`

## Component-Specific Theme Management
This achieved by using `styled-components`.

Strategies:
- Use `styled-components` ThemeProvider. In each styled component, 
you can access the theme through `props.theme`
- Create a wrapper styled component that specifies the css properties
for child classes. This is more specific than the default ant-design
properties, causing an override. 