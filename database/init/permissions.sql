USE barbak;

-- Users

CREATE TABLE user_roles (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO user_roles (`name`) VALUES
    ('admin'),
    ('editor'),
    ('standard'),
    ('guest')
;

SELECT id INTO @admin_role_id FROM user_roles WHERE name = 'admin';
SELECT id INTO @editor_role_id FROM user_roles WHERE name = 'editor';
SELECT id INTO @standard_role_id FROM user_roles WHERE name = 'standard';
SELECT id INTO @guest_role_id FROM user_roles WHERE name = 'guest';

-- Permissions

CREATE TABLE role_permissions (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `action` JSON NOT NULL,
    `subject` JSON NOT NULL,
    `fields` JSON,
    `conditions` JSON,
    `inverted` TINYINT(1) NOT NULL DEFAULT 0,
    `reason` VARCHAR(255),
    `description` VARCHAR(255),
    PriMARY KEY(`id`)
);

INSERT INTO role_permissions (`action`, `subject`, `fields`, `conditions`, `description`) VALUES
    -- Admin has ability to commit any action to any subject
        ('[ "manage" ]', '[ "all" ]', NULL, NULL, 'Permission to commit any action on any subject'),
    -- Account Permissions
        -- Create Account Resources
        ('[ "create" ]', '[ "accounts" ]', NULL, NULL, 'Permission to [create] [account] resources'),
        -- Modify Own Account Resources
        ('[ "update", "delete" ]', '[ "accounts" ]', NULL, '{
            "_id": "USER_ID"
        }', 'Permission to [update, delete] own [account] resources'),
    
    -- User Permissions
        -- Missing Permission for creating other Users ***
        
        -- Full Control of Own User Resources
        ('[ "read", "update", "delete" ]', '[ "users" ]', NULL, '{
            "_id": "USER_ID"
        }', 'Permission to [read, update, delete] own [user] resources'),
        -- Read 'Public' User Resources (Public)
        ('[ "read" ]', '[ "users" ]', '[
            "_id",
            "username",
            "about_me",
            "profile_image_url",
            "experiences",
            "achievements",
            "education",
            "skills",
            "interests",
            "public",
            "expertise_level",
            "role_info"
        ]', '{
            "public": true
        }', 'Permission to [read] public [user] resources (Public)'),
        -- Read 'Private' User Resources
        ('[ "read" ]', '[ "users" ]', '[
            "_id",
            "username",
            "about_me",
            "profile_image_url",
            "public"
        ]', '{
            "public": false
        }', 'Permission to [read] private [user] resources'),
    -- Drinkware Permissions
        -- Create Verified Drinkware Resources
        ('[ "create" ]', '[ "drinkware" ]', NULL, '{
            "variant": "Verified Drinkware"
        }', 'Permission to [create] verified [drinkware] resources'),
        -- Create User Drinkware Resources
        ('[ "create" ]', '[ "drinkware" ]', NULL, '{
            "variant": "User Drinkware"
        }', 'Permission to [create] user [drinkware] resources'),
        -- Full Control of Own Drinkware Resources
        ('[ "read", "update", "delete" ]', '[ "drinkware" ]', NULL, '{
            "variant": "User Drinkware",
            "user": "USER_ID"
        }', 'Permission to [read, update, delete] own [drinkware] resources'),
        -- Read Verified Drinkware Resources (Public)
        ('[ "read" ]', '[ "drinkware" ]', '[
            "_id",
            "name",
            "description",
            "cover"
        ]', '{
            "variant": "Verified Drinkware"
        }', 'Permission to [read] verified [drinkware] resources (Public)'),
        -- Read Verified Drinkware Resources (Private)
        ('[ "read" ]', '[ "drinkware" ]', NULL, '{
            "variant": "Verified Drinkware"
        }', 'Permission to [read] verified [drinkware] resources (Private)'),
        -- Modify Verified Drinkware Resources
        ('[ "update", "delete" ]', '[ "drinkware" ]', NULL, '{
            "variant": "Verified Drinkware"
        }', 'Permission to [update, delete] verified [drinkware] resources'),
        -- Read 'Public' User Drinkware Resources (Public)
        ('[ "read" ]', '[ "drinkware" ]', '[
            "_id",
            "name",
            "description",
            "cover",
            "user",
            "public"
        ]', '{
            "variant": "User Drinkware",
            "public": true
        }', 'Permission to [read] public user [drinkware] resources (Public)'),
        -- Read 'Public' User Drinkware Resources (Private)
        ('[ "read" ]', '[ "drinkware" ]', NULL, '{
            "variant": "User Drinkware",
            "public": true
        }', 'Permission to [read] public user [drinkware] resources (Private)'),
        -- Modify 'Public' User Drinkware Resources
        ('[ "update", "delete" ]', '[ "drinkware" ]', NULL, '{
            "variant": "User Drinkware",
            "public": true
        }', 'Permission to [update, delete] public user [drinkware] resources'),
    -- Tool Permissions
        -- Create Verified Tool Resources
        ('[ "create" ]', '[ "tools" ]', NULL, '{
            "variant": "Verified Tool"
        }', 'Permission to [create] verified [tool] resources'),
        -- Create User Tool Resources
        ('[ "create" ]', '[ "tools" ]', NULL, '{
            "variant": "User Tool"
        }', 'Permission to [create] user [tool] resources'),
        -- Full Control of Own Tool Resources
        ('[ "read", "update", "delete" ]', '[ "tools" ]', NULL, '{
            "variant": "User Tool",
            "user": "USER_ID"
        }', 'Permission to [read, update, delete] own [tool] resources'),
        -- Read Verified Tool Resources (Public)
        ('[ "read" ]', '[ "tools" ]', '[
            "_id",
            "name",
            "description",
            "category",
            "cover",
            "verified",
            "category_info"
        ]', '{
            "variant": "Verified Tool"
        }', 'Permission to [read] verified [tool] resources (Public)'),
        -- Read Verified Tool Resources (Private)
        ('[ "read" ]', '[ "tools" ]', NULL, '{
            "variant": "Verified Tool"
        }', 'Permission to [read] verified [tool] resources (Private)'),
        -- Modify Verified Tool Resources
        ('[ "update", "delete" ]', '[ "tools" ]', NULL, '{
            "variant": "Verified Tool"
        }', 'Permission to [update, delete] verified [tool] resources'),
        -- Read 'Public' User Tool Resources (Public)
        ('[ "read" ]', '[ "tools" ]', '[
            "_id",
            "name",
            "description",
            "category",
            "cover",
            "user",
            "public",
            "verified",
            "category_info"
        ]', '{
            "variant": "User Tool",
            "public": true
        }', 'Permission to [read] public user [tool] resources (Public)'),
        -- Read 'Public' User Tool Resources (Private)
        ('[ "read" ]', '[ "tools" ]', NULL, '{
            "variant": "User Tool",
            "public": true
        }', 'Permission to [read] public user [tool] resources (Private)'),
        -- Modify 'Public' User Tool Resources
        ('[ "update", "delete" ]', '[ "tools" ]', NULL, '{
            "variant": "User Tool",
            "public": true
        }', 'Permission to [update, delete] public user [tool] resources'),
    -- Ingredient Permissions
        -- Create Verified Ingredient Resources
        ('[ "create" ]', '[ "ingredients" ]', NULL, '{
            "variant": "Verified Ingredient"
        }', 'Permission to [create] verified [ingredient] resources'),
        -- Create User Ingredient Resources
        ('[ "create" ]', '[ "ingredients" ]', NULL, '{
            "variant": "User Ingredient"
        }', 'Permission to [create] user [ingredient] resources'),
        -- Full Control of own Ingredient Resources
        ('[ "read", "update", "delete" ]', '[ "ingredients" ]', NULL, '{
            "variant": "User Ingredient",
            "user": "USER_ID"
        }', 'Permission to [read, update, delete] own [ingredient] resources'),
        -- Read Verified Ingredient Resources (Public)
        ('[ "read" ]', '[ "ingredients" ]', '[
            "_id",
            "name",
            "description",
            "category",
            "sub_category",
            "cover",
            "verified",
            "classification_info"
        ]', '{
            "variant": "Verified Ingredient"
        }', 'Permission to [read] verified [ingredient] resources (Public)'),
        -- Read Verified Ingredient Resources (Private)
        ('[ "read" ]', '[ "ingredients" ]', NULL, '{
            "variant": "Verified Ingredient"
        }', 'Permission to [read] verified [ingredient] resources (Private)'),
        -- Modify Verified Ingredient Resources
        ('[ "update", "delete" ]', '[ "ingredients" ]', NULL, '{
            "variant": "Verified Ingredient"
        }', 'Permission to [update, delete] verified [ingredient] resources'),
        -- Read 'Public' User Ingredient Resources (Public)
        ('[ "read" ]', '[ "ingredients" ]', '[
            "_id",
            "name",
            "description",
            "category",
            "sub_category",
            "cover",
            "user",
            "public",
            "verified",
            "classification_info"
        ]', '{
            "variant": "User Ingredient",
            "public": true
        }', 'Permission to [read] public user [ingredient] resources (Public)'),
        -- Read 'Public' User Ingredient Resources (Private)
        ('[ "read" ]', '[ "ingredients" ]', NULL, '{
            "variant": "User Ingredient",
            "public": true
        }', 'Permission to [read] public user [ingredient] resources (Private)'),
        -- Modify 'Public' User Ingredient Resources
        ('[ "update", "delete" ]', '[ "ingredients" ]', NULL, '{
            "variant": "User Ingredient",
            "public": true
        }', 'Permission to [update, delete] public user [ingredient] resources'),
    -- Drink Permissions
        -- Create Verified Drink Resources
        ('[ "create" ]', '[ "drinks" ]', NULL, '{
            "variant": "Verified Drink"
        }', 'Permission to [create] verified [drink] resources'),
        -- Create User Drink Resources
        ('[ "create" ]', '[ "drinks" ]', NULL, '{
            "variant": "User Drink"
        }', 'Permission to [create] user [drink] resources'),
        -- Full Control of Own Drink Resources
        ('[ "read", "update", "delete" ]', '[ "drinks" ]', NULL, '{
            "variant": "User Drink",
            "user": "USER_ID"
        }', 'Permission to [read, update, delete] own [drink] resources'),
        -- Read Verified Drink Resources (Public)
        ('[ "read" ]', '[ "drinks" ]', '[
            "_id",
            "name",
            "description",
            "preparation_method",
            "serving_style",
            "drinkware",
            "preparation",
            "ingredients",
            "tools",
            "tags",
            "assets",
            "verified",
            "drinkware_info",
            "tool_info",
            "preparation_method_info",
            "serving_style_info"
        ]', '{
            "variant": "Verified Drink"
        }', 'Permission to [read] verified [drink] resources (Public)'),
        -- Read Verified Drink Resources (Private)
        ('[ "read" ]', '[ "drinks" ]', NULL, '{
            "variant": "Verified Drink"
        }', 'Permission to [read] verified [drink] resources (Private)'),
        -- Modify Verified Drink Resources
        ('[ "update", "delete" ]', '[ "drinks" ]', NULL, '{
            "variant": "Verified Drink"
        }', 'Permission to [update, delete] verified [drink] resources'),
        -- Read 'Public' User Drink Resources (Public)
        ('[ "read" ]', '[ "drinks" ]', '[
            "_id",
            "name",
            "description",
            "preparation_method",
            "serving_style",
            "drinkware",
            "preparation",
            "ingredients",
            "tools",
            "tags",
            "assets",
            "user",
            "public",
            "verified",
            "drinkware_info",
            "tool_info",
            "preparation_method_info",
            "serving_style_info"
        ]', '{
            "variant": "User Drink",
            "public": true
        }', 'Permission to [read] public user [drink] resources (Public)'),
        -- Read 'Public' User Drink Resources (Private)
        ('[ "read" ]', '[ "drinks" ]', NULL, '{
            "variant": "User Drink",
            "public": true
        }', 'Permission to [read] public user [drink] resources (Private)'),
        -- Modify 'Public' User Drink Resources
        ('[ "update", "delete" ]', '[ "drinks" ]', NULL, '{
            "variant": "User Drink",
            "public": true
        }', 'Permission to [update, delete] public user [drink] resources')
;

-- Preventative Permissions
INSERT INTO role_permissions (`action`,`subject`, `fields`, `conditions`, `inverted`, `description`) VALUES
    -- Unauthorized to [update] attribute [role] on [user] resources
    ('[ "update" ]', '[ "users" ]', '[ "role" ]', NULL, 1, 'Unauthorized to [update] attribute [role] on [user] resources')
;

-- User Role Permissions

CREATE TABLE user_permissions (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `role_id` INT(6) NOT NUll,
    `permission_id` INT(6) NOT NULL,
    PriMARY KEY (`id`),
    FOREIGN KEY (`role_id`) REFERENCES user_roles (`id`),
    FOREIGN KEY (`permission_id`) REFERENCES role_permissions (`id`)
);

INSERT INTO user_permissions (`role_id`, `permission_id`) VALUES
    (@admin_role_id, 1),

    (@editor_role_id, 3),
    (@editor_role_id, 4),
    (@editor_role_id, 5),
    (@editor_role_id, 6),
    (@editor_role_id, 7),
    (@editor_role_id, 8),
    (@editor_role_id, 9),
    (@editor_role_id, 10),
    (@editor_role_id, 11),
    (@editor_role_id, 12),
    (@editor_role_id, 13),
    (@editor_role_id, 14),
    (@editor_role_id, 15),
    (@editor_role_id, 16),
    (@editor_role_id, 17),
    (@editor_role_id, 18),
    (@editor_role_id, 19),
    (@editor_role_id, 20),
    (@editor_role_id, 21),
    (@editor_role_id, 22),
    (@editor_role_id, 23),
    (@editor_role_id, 24),
    (@editor_role_id, 25),
    (@editor_role_id, 26),
    (@editor_role_id, 27),
    (@editor_role_id, 28),
    (@editor_role_id, 29),
    (@editor_role_id, 30),
    (@editor_role_id, 31),
    (@editor_role_id, 32),
    (@editor_role_id, 33),
    (@editor_role_id, 34),
    (@editor_role_id, 35),
    (@editor_role_id, 36),
    (@editor_role_id, 37),
    (@editor_role_id, 38),
    (@editor_role_id, 39),
    (@editor_role_id, 40),
    (@editor_role_id, 41),
    (@editor_role_id, 42),
    (@editor_role_id, 43),

    (@standard_role_id, 3),
    (@standard_role_id, 4),
    (@standard_role_id, 5),
    (@standard_role_id, 6),
    (@standard_role_id, 8),
    (@standard_role_id, 9),
    (@standard_role_id, 10),
    (@standard_role_id, 13),
    (@standard_role_id, 17),
    (@standard_role_id, 18),
    (@standard_role_id, 19),
    (@standard_role_id, 22),
    (@standard_role_id, 26),
    (@standard_role_id, 27),
    (@standard_role_id, 28),
    (@standard_role_id, 31),
    (@standard_role_id, 35),
    (@standard_role_id, 36),
    (@standard_role_id, 37),
    (@standard_role_id, 40),
    (@standard_role_id, 43),

    (@guest_role_id, 2),
    (@guest_role_id, 5),
    (@guest_role_id, 6),
    (@guest_role_id, 10),
    (@guest_role_id, 13),
    (@guest_role_id, 19),
    (@guest_role_id, 22),
    (@guest_role_id, 28),
    (@guest_role_id, 31),
    (@guest_role_id, 37),
    (@guest_role_id, 40)
;