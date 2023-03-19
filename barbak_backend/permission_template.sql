
CREATE TABLE user_roles (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);
INSERT INTO user_roles (`name`) VALUES
    ('admin'),
    ('editor'),
    ('user')
;

CREATE TABLE permission_subjects (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);
INSERT INTO permission_subjects (`name`) VALUES
    ('account'),
    ('users'),
    ('assets')
;

CREATE TABLE role_permissions (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `role_id` INT(6) NOT NULL,
    `subject_id` INT(6) NOT NULL,
    `action` ENUM('create','read','update','delete') NOT NULL,
    `condition` JSON,

    PRIMARY KEY (`id`),
    FOREIGN KEY (`subject_id`) REFERENCES permission_subjects (`id`),
    FOREIGN KEY (`role_id`) REFERENCES user_roles (`id`)
);

INSERT INTO role_permissions (`role_id`, `subject_id`, `action`, `condition`) VALUES
    ((SELECT id FROM user_roles WHERE name = 'user'), (SELECT id FROM permission_subjects WHERE name = 'account'), 'create', '{ "public": true }')
;