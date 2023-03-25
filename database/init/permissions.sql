SELECT id INTO @admin_role_id FROM user_roles WHERE name = 'admin';
SELECT id INTO @editor_role_id FROM user_roles WHERE name = 'editor';
SELECT id INTO @user_role_id FROM user_roles WHERE name = 'user';
SELECT id INTO @guest_role_id FROM user_roles WHERE name = 'guest';

CREATE TABLE role_permissions (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `role_id` INT(6),
    `action` ENUM ('create','read','update','delete', 'manage') NOT NULL,
    `subject` VARCHAR(50) NOT NULL,
    `fields` JSON,
    `conditions` VARCHAR(255),
    `inverted` BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
);

-- Admin Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Admin has ability to commit any action to any subject
    (@admin_role_id, 'manage', 'all', NULL)
;

-- Editor Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Account Rules
    (@editor_role_id, 'update', 'account', NULL),
    (@editor_role_id, 'delete', 'account', NULL),

    -- User Rules
    (@editor_role_id, 'read', 'users', '{ "_id": "USER_ID" }'),
    (@editor_role_id, 'update', 'users', '{ "_id": "USER_ID" }'),
    
    -- Drinkware Rules
    (@editor_role_id, 'create', 'drinkware', '{ "verified": false }'),
    (@editor_role_id, 'create', 'drinkware', '{ "verified": true }'),
    (@editor_role_id, 'read', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),
    (@editor_role_id, 'update', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),
    (@editor_role_id, 'delete', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),

    -- Tool Rules
    (@editor_role_id, 'create', 'tools', '{ "verified": false }'),
    (@editor_role_id, 'create', 'tools', '{ "verified": true }'),
    (@editor_role_id, 'read', 'tools', '{ "model": "User Tool", "user": "USER_ID" }'),
    (@editor_role_id, 'update', 'tools', '{ "model": "User Tool", "user": "USER_ID" }'),
    (@editor_role_id, 'delete', 'tools', '{ "model": "User Tool", "user": "USER_ID" }'),

    -- Additional Rules
        -- Verified Drinkware Rules
        (@editor_role_id, 'update', 'drinkware', '{ "model": "Verified Drinkware" }'),
        (@editor_role_id, 'delete', 'drinkware', '{ "model": "Verified Drinkware" }'),

        -- Verified Tool Rules
        (@editor_role_id, 'update', 'tools', '{ "model": "Verified Tool" }'),
        (@editor_role_id, 'delete', 'tools', '{ "model": "Verified Tool" }'),

        -- Public User Drinkware Rules
        (@editor_role_id, 'update', 'drinkware', '{ "model": "User Drinkware", "public": true }'),
        (@editor_role_id, 'delete', 'drinkware', '{ "model": "User Drinkware", "public": true }'),

        (@editor_role_id, 'update', 'tools', '{ "model": "User Tool", "public": true }'),
        (@editor_role_id, 'delete', 'tools', '{ "model": "User Tool", "public": true }')
;

-- User Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Account Rules
    (@user_role_id, 'update', 'account', NULL),
    (@user_role_id, 'delete', 'account', NULL),
    
    -- User Rules
    (@user_role_id, 'read', 'users', '{ "_id": "USER_ID" }'),
    (@user_role_id, 'update', 'users', '{ "_id": "USER_ID" }'),

    -- Drinkware Rules
    (@user_role_id, 'create', 'drinkware', '{ "verified": false }'),
    (@user_role_id, 'read', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),
    (@user_role_id, 'update', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),
    (@user_role_id, 'delete', 'drinkware', '{ "model": "User Drinkware", "user": "USER_ID" }'),

    -- Tool Rules
    (@user_role_id, 'create', 'tools', '{ "verified": false }'),
    (@user_role_id, 'read', 'tools', '{ "model": "User Tool", "user": "USER_ID" }'),
    (@user_role_id, 'update', 'tools', '{ "model": "User Tool", "user": "USER_ID" }'),
    (@user_role_id, 'delete', 'tools', '{ "model": "User Tool", "user": "USER_ID" }')
;

-- Guest Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    (@guest_role_id, 'create', 'account', NULL)
;

-- All Users Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Asset Rules
        (NULL, 'read', 'assets', NULL),
        
    -- User Content
    (NULL, 'read', 'users', '{ "public": true }'),
    (NULL, 'read', 'drinkware', '{ "model": "User Drinkware", "public": true }'),
    (NULL, 'read', 'tools', '{ "model": "User Tool", "public": true }'),

    -- Verified Content
    (NULL, 'read', 'drinkware', '{ "model": "Verified Drinkware" }'),
    (NULL, 'read', 'tools', '{ "model": "Verified Tool" }')
;