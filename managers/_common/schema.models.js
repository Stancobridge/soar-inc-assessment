const emojis = require('../../public/emojis.data.json');

module.exports = {
    id: {
        path: 'id',
        type: 'string',
        length: { min: 1, max: 50 },
        label: 'id',
    },
    username: {
        path: 'username',
        type: 'string',
        length: { min: 3, max: 20 },
        custom: 'username',
        label: 'username',
    },
    password: {
        path: 'password',
        type: 'string',
        length: { min: 8, max: 100 },
        label: 'password',
    },
    title: {
        path: 'title',
        type: 'string',
        length: { min: 3, max: 300 },
        label: 'title',
    },
    label: {
        path: 'label',
        type: 'string',
        length: { min: 3, max: 100 },
        label: 'label',
    },
    shortDesc: {
        path: 'desc',
        type: 'string',
        length: { min: 3, max: 300 },
        label: 'shortDesc',
    },
    longDesc: {
        path: 'desc',
        type: 'string',
        length: { min: 3, max: 2000 },
        label: 'longDesc',
    },
    url: {
        path: 'url',
        type: 'string',
        length: { min: 9, max: 300 },
        label: 'url',
    },
    emoji: {
        path: 'emoji',
        type: 'Array',
        label: 'emoji',
        items: {
            type: 'string',
            length: { min: 1, max: 10 },
            oneOf: emojis.value,
        },
    },
    price: {
        path: 'price',
        type: 'number',
        label: 'price',
    },
    avatar: {
        path: 'avatar',
        type: 'string',
        length: { min: 8, max: 100 },
        label: 'avatar',
    },
    text: {
        path: 'text',
        type: 'string',
        length: { min: 3, max: 15 },
        label: 'text',
    },
    longText: {
        path: 'longText',
        type: 'string',
        length: { min: 3, max: 250 },
        label: 'longText',
    },
    paragraph: {
        path: 'paragraph',
        type: 'string',
        length: { min: 3, max: 10000 },
        label: 'paragraph',
    },
    phone: {
        path: 'phone',
        type: 'string',
        length: { min: 10, max: 13 },
        label: 'phone',
    },
    email: {
        path: 'email',
        type: 'string',
        regex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'Invalid email address',
        label: 'email',
    },
    number: {
        path: 'number',
        type: 'number',
        length: { min: 1, max: 6 },
        label: 'number',
    },
    arrayOfStrings: {
        type: 'Array',
        items: {
            type: 'string',
            length: { min: 3, max: 100 },
        },
    },
    obj: {
        type: 'Object',
    },
    bool: {
        type: 'Boolean',
    },
    name: {
        path: 'name',
        type: 'string',
        length: { min: 3, max: 100 },
        label: 'name',
    },
    address: {
        path: 'address',
        type: 'string',
        length: { min: 5, max: 120 },
        label: 'address',
    },
    website: {
        path: 'website',
        type: 'string',
        length: { min: 5, max: 100 },
        label: 'website',
    },
    description: {
        path: 'description',
        type: 'string',
        length: { min: 3, max: 1000 },
        label: 'description',
    },
    schoolId: {
        path: 'schoolId',
        type: 'string',
        label: 'schoolId',
    },
    userId: {
        path: 'userId',
        type: 'string',
        label: 'userId',
    },
};
