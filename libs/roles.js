const isSuperAdmin = (roles) => {
    return roles.some((role) => role === 'super-admin');
};

const isSchoolAdmin = (roles) => {
    return roles.some((role) => role === 'school-admin');
};

module.exports = { isSuperAdmin, isSchoolAdmin };
