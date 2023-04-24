use barbak;

-- Users

CREATE TABLE user_roles (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO user_roles (`name`) VALUES
    ('admin'),
    ('editor'),
    ('user'),
    ('guest')
;

-- Permissions

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
    `inverted` TINYINT(1) NOT NULL DEFAULT 0,
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

    -- User Roles
    (@editor_role_id, 'read', 'users', '{ "document._id": "USER_ID" }'),
    (@editor_role_id, 'update', 'users', '{ "document._id": "USER_ID" }'),

    -- Drinkware Rules
    (@editor_role_id, 'create', 'drinkware', '{ "subject_type": "user" }'),
    (@editor_role_id, 'read', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'update', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'delete', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),

    -- Tool Rules
    (@editor_role_id, 'create', 'tools', '{ "subject_type": "user" }'),
    (@editor_role_id, 'read', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'update', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'delete', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),

    -- Ingredient Rules
    (@editor_role_id, 'create', 'ingredients', '{ "subject_type": "user" }'),
    (@editor_role_id, 'read', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'update', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'delete', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),

    -- Drink Rules
    (@editor_role_id, 'create', 'drinks', '{ "subject_type": "user" }'),
    (@editor_role_id, 'read', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'update', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }'),
    (@editor_role_id, 'delete', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }'),

    -- Additional Rules
        -- Verified Drinkware Rules
        (@editor_role_id, 'create', 'drinkware', '{ "subject_type": "verified" }'),
        (@editor_role_id, 'read', 'drinkware', '{
            "action_type": "private", 
            "document.variant": "Verified Drinkware" 
        }'),
        (@editor_role_id, 'update', 'drinkware', '{ "document.variant": "Verified Drinkware" }'),
        (@editor_role_id, 'delete', 'drinkware', '{ "document.variant": "Verified Drinkware" }'),

        -- Verified Tool Rules
        (@editor_role_id, 'create', 'tools', '{ "subject_type": "verified" }'),
        (@editor_role_id, 'read', 'tools', '{
            "action_type": "private", 
            "document.variant": "Verified Tool"
        }'),
        (@editor_role_id, 'update', 'tools', '{"document.variant": "Verified Tool" }'),
        (@editor_role_id, 'delete', 'tools', '{ "document.variant": "Verified Tool" }'),

        -- Verified Ingredient Rules
        (@editor_role_id, 'create', 'ingredients', '{ "subject_type": "verified" }'),
        (@editor_role_id, 'read', 'ingredients', '{
            "action_type": "private", 
            "document.variant": "Verified Ingredient"
        }'),
        (@editor_role_id, 'update', 'ingredients', '{ "document.variant": "Verified Ingredient" }'),
        (@editor_role_id, 'delete', 'ingredients', '{ "document.variant": "Verified Ingredient" }'),

        -- Verified Drink Rules
        (@editor_role_id, 'create', 'drinks', '{ "subject_type": "verified" }'),
        (@editor_role_id, 'read', 'drinks', '{ 
            "action_type": "private", 
            "document.variant": "Verified Drink" 
        }'),
        (@editor_role_id, 'update', 'drinks', '{ "document.variant": "Verified Drink" }'),
        (@editor_role_id, 'delete', 'drinks', '{ "document.variant": "Verified Drink" }'),

        -- Public User Drinkware Rules
        (@editor_role_id, 'read', 'drinkware', '{
            "action_type": "private",
            "document.variant": "User Drinkware",
            "document.public": true
        }'),
        (@editor_role_id, 'update', 'drinkware', '{
            "document.variant": "User Drinkware",
            "document.public": true
        }'),
        (@editor_role_id, 'delete', 'drinkware', '{
            "document.variant": "User Drinkware",
            "document.public": true
        }'),

        -- Public User Tool Rules
        (@editor_role_id, 'read', 'tools', '{
            "action_type": "private",
            "document.variant": "User Tool",
            "document.public": true
        }'),
        (@editor_role_id, 'update', 'tools', '{
            "document.variant": "User Tool",
            "document.public": true
        }'),
        (@editor_role_id, 'delete', 'tools', '{
            "document.variant": "User Tool",
            "document.public": true
        }'),

        -- Public User Ingredient Rules
        (@editor_role_id, 'read', 'ingredients', '{
            "action_type": "private",
            "document.variant": "User Ingredient",
            "document.public": true
        }'),
        (@editor_role_id, 'update', 'ingredients', '{
            "document.variant": "User Ingredient",
            "document.public": true
        }'),
        (@editor_role_id, 'delete', 'ingredients', '{
            "document.variant": "User Ingredient",
            "document.public": true
        }'),

        -- Public User Drink Rules
        (@editor_role_id, 'read', 'drink', '{
            "action_type": "private",
            "document.variant": "User Drink",
            "document.public": true
        }'),
        (@editor_role_id, 'update', 'drinks', '{
            "document.variant": "User Drink",
            "document.public": true
        }'),
        (@editor_role_id, 'delete', 'drinks', '{
            "document.variant": "User Drink",
            "document.public": true
        }')
;

-- User Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Account Rules
    (@user_role_id, 'update', 'account', NULL),
    (@user_role_id, 'delete', 'account', NULL),

    -- User Roles
    (@user_role_id, 'read', 'users', '{ "document._id": "USER_ID" }'),
    (@user_role_id, 'update', 'users', '{ "document._id": "USER_ID" }'),

    -- Drinkware Rules
    (@user_role_id, 'create', 'drinkware', '{ "subject_type": "user" }'),
    (@user_role_id, 'read', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'update', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'delete', 'drinkware', '{
        "document.variant": "User Drinkware",
        "document.user": "USER_ID"
    }'),

    -- Tool Rules
    (@user_role_id, 'create', 'tools', '{ "subject_type": "user" }'),
    (@user_role_id, 'read', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'update', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'delete', 'tools', '{
        "document.variant": "User Tool",
        "document.user": "USER_ID"
    }'),

    -- Ingredient Rules
    (@user_role_id, 'create', 'ingredients', '{ "subject_type": "user" }'),
    (@user_role_id, 'read', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'update', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'delete', 'ingredients', '{
        "document.variant": "User Ingredient",
        "document.user": "USER_ID"
    }'),

    -- Drink Rules
    (@user_role_id, 'create', 'drinks', '{ "subject_type": "user" }'),
    (@user_role_id, 'read', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'update', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }'),
    (@user_role_id, 'delete', 'drinks', '{
        "document.variant": "User Drink",
        "document.user": "USER_ID"
    }')
;

-- Guest Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    (@guest_role_id, 'create', 'account', NULL)
;

-- All User Permissions
INSERT INTO role_permissions (`role_id`, `action`, `subject`, `conditions`) VALUES
    -- Asset Rules
    -- (NULL, 'read', 'assets', NULL),

    -- User Content
    (NULL, 'read', 'users', '{ 
        "action_type": "public", 
        "document.public": true 
    }'),
    (NULL, 'read', 'drinkware', '{ 
        "action_type": "public", 
        "document.variant": "User Drinkware", 
        "document.public": true 
    }'),
    (NULL, 'read', 'tools', '{ 
        "action_type": "public", 
        "document.variant": "User Tool", 
        "document.public": true 
    }'),
    (NULL, 'read', 'ingredients', '{ 
        "action_type": "public", 
        "document.variant": "User Ingredient", 
        "document.public": true 
    }'),
    (NULL, 'read', 'drinks', '{ 
        "action_type": "public", 
        "document.variant": "User Drink", 
        "document.public": true 
    }'),

    -- Verified Content
    (NULL, 'read', 'drinkware', '{
        "action_type": "public",
        "document.variant": "Verified Drinkware"
    }'),
    (NULL, 'read', 'tools', '{
        "action_type": "public",
        "document.variant": "Verified Tool"
    }'),
    (NULL, 'read', 'ingredients', '{
        "action_type": "public",
        "document.variant": "Verified Ingredient"
    }'),
    (NULL, 'read', 'drinks', '{
        "action_type": "public",
        "document.variant": "Verified Drink"
    }')
;