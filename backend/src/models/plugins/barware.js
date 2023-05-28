const { accessibleFieldsPlugin } = require('@casl/mongoose');

// Mongoose plugin for models related to barware
module.exports = function barwarePlugin(schema, options) {
    // Adding a plugin to the schema that will prevent access to unauthorized field
    schema.plugin(accessibleFieldsPlugin, {
        getFields: (schema) => ([
            ...Object.keys({
                ...schema.paths,
                ...schema.virtuals
            }),
            ...(schema.discriminators ? Object.entries(schema.discriminators).reduce((accumulator, [key, value]) => {
                return [
                    ...accumulator,
                    ...Object.keys({
                        ...value.paths,
                        ...value.virtuals
                    })
                ]
            }, []) : [])
        ])
    });
}