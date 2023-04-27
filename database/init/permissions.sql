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
    `action` JSON NOT NULL,
    `subject` JSON NOT NULL,
    `fields` JSON,
    `conditions` JSON,
    `inverted` TINYINT(1) NOT NULL DEFAULT 0,
    `reason` VARCHAR(255),
    `description` VARCHAR(255),
    PriMARY KEY(`id`)
);

INSERT INTO role_permissions (`action`,`subject`,`conditions`, `description`) VALUES
    -- Admin has ability to commit any action to any subject
        ('[ "manage" ]', '[ "all" ]', NULL, 'Permission to commit any action on any subject'),
    -- Account Permissions
        -- Create Account Resources
        ('[ "create" ]', '[ "accounts" ]', NULL, 'Permission to [create] [account] resources'),
        -- Modify Own Account Resources
        ('[ "update", "delete" ]', '[ "accounts" ]', '{
            "document._id": "USER_ID"
        }', 'Permission to [update, delete] own [account] resources'),
    
    -- User Permissions
        -- Missing Permission for creating other Users ***
        -- Read Own User Resources
        ('[ "read" ]', '[ "users" ]', '{
            "document._id": "USER_ID",
            "action_type": { "$in": [ "public", "private" ] }
        }', 'Permission to [read] own [user] resources'),
        -- Modify Own User Resources
        ('[ "update", "delete" ]', '[ "users" ]', '{
            "document._id": "USER_ID"
        }', 'Permission to [update, delete] own [user] resources'),
        -- Read 'Public' User Resources (Public)
        ('[ "read" ]', '[ "users" ]', '{
            "action_type": "public",
            "document.public": true
        }', 'Permission to [read] public [user] resources (Public)'),
    -- Drinkware Permissions
        -- Create Verified Drinkware Resources
        ('[ "create" ]', '[ "drinkware" ]', '{
            "subject_type": "verified"
        }', 'Permission to [create] verified [drinkware] resources'),
        -- Create User Drinkware Resources
        ('[ "create" ]', '[ "drinkware" ]', '{
            "subject_type": "user"
        }', 'Permission to [create] user [drinkware] resources'),
        -- Read Own Drinkware Resources
        ('[ "read" ]', '[ "drinkware" ]', '{
            "document.variant": "User Drinkware",
            "document.user": "USER_ID",
            "action_type": { "$in": [ "public", "private" ] }
        }', 'Permission to [read] own [drinkware] resources'),
        -- Modify Own Drinkware Resources
        ('[ "update", "delete" ]', '[ "drinkware" ]', '{
            "document.variant": "User Drinkware",
            "document.user": "USER_ID"
        }', 'Permission to [update, delete] own [drinkware] resources'),
        -- Read Verified Drinkware Resources (Public)
        ('[ "read" ]', '[ "drinkware" ]', '{
            "document.variant": "Verified Drinkware",
            "action_type": "public"
        }', 'Permission to [read] verified [drinkware] resources (Public)'),
        -- Read Verified Drinkware Resources (Private)
        ('[ "read" ]', '[ "drinkware" ]', '{
            "document.variant": "Verified Drinkware",
            "action_type": "private"
        }', 'Permission to [read] verified [drinkware] resources (Private)'),
        -- Modify Verified Drinkware Resources
        ('[ "update", "delete" ]', '[ "drinkware" ]', '{
            "document.variant": "Verified Drinkware"
        }', 'Permission to [update, delete] verified [drinkware] resources'),
        -- Read 'Public' User Drinkware Resources (Public)
        ('[ "read" ]', '[ "drinkware" ]', '{
            "document.variant": "User Drinkware",
            "document.public": true,
            "action_type": "public"
        }', 'Permission to [read] public user [drinkware] resources (Public)'),
        -- Read 'Public' User Drinkware Resources (Private)
        ('[ "read" ]', '[ "drinkware" ]', '{
            "document.variant": "User Drinkware",
            "document.public": true,
            "action_type": "private"
        }', 'Permission to [read] public user [drinkware] resources (Private)'),
        -- Modify 'Public' User Drinkware Resources
        ('[ "update", "delete" ]', '[ "drinkware" ]', '{
            "document.variant": "User Drinkware",
            "document.public": true
        }', 'Permission to [update, delete] public user [drinkware] resources'),
    -- Tool Permissions
        -- Create Verified Tool Resources
        ('[ "create" ]', '[ "tools" ]', '{
            "subject_type": "verified"
        }', 'Permission to [create] verified [tool] resources'),
        -- Create User Tool Resources
        ('[ "create" ]', '[ "tools" ]', '{
            "subject_type": "user"
        }', 'Permission to [create] user [tool] resources'),
        -- Read Own Tool Resources
        ('[ "read" ]', '[ "tools" ]', '{
            "document.variant": "User Tool",
            "document.user": "USER_ID",
            "action_type": { "$in": [ "public", "private" ] }
        }', 'Permission to [read] own [tool] resources'),
        -- Modify Own Tool Resources
        ('[ "update", "delete" ]', '[ "tools" ]', '{
            "document.variant": "User Tool",
            "document.user": "USER_ID"
        }', 'Permission to [update, delete] own [tool] resources'),
        -- Read Verified Tool Resources (Public)
        ('[ "read" ]', '[ "tools" ]', '{
            "document.variant": "Verified Tool",
            "action_type": "public"
        }', 'Permission to [read] verified [tool] resources (Public)'),
        -- Read Verified Tool Resources (Private)
        ('[ "read" ]', '[ "tools" ]', '{
            "document.variant": "Verified Drinkware",
            "action_type": "private"
        }', 'Permission to [read] verified [tool] resources (Private)'),
        -- Modify Verified Tool Resources
        ('[ "update", "delete" ]', '[ "tools" ]', '{
            "document.variant": "Verified Tool"
        }', 'Permission to [update, delete] verified [tool] resources'),
        -- Read 'Public' User Tool Resources (Public)
        ('[ "read" ]', '[ "tools" ]', '{
            "document.variant": "User Tool",
            "document.public": true,
            "action_type": "public"
        }', 'Permission to [read] public user [tool] resources (Public)'),
        -- Read 'Public' User Tool Resources (Private)
        ('[ "read" ]', '[ "tools" ]', '{
            "document.variant": "User Tool",
            "document.public": true,
            "action_type": "private"
        }', 'Permission to [read] public user [tool] resources (Private)'),
        -- Modify 'Public' User Tool Resources
        ('[ "update", "delete" ]', '[ "tools" ]', '{
            "document.variant": "User Tool",
            "document.public": true
        }', 'Permission to [update, delete] public user [tool] resources'),
    -- Ingredient Permissions
        -- Create Verified Ingredient Resources
        ('[ "create" ]', '[ "ingredients" ]', '{
            "subject_type": "verified"
        }', 'Permission to [create] verified [ingredient] resources'),
        -- Create User Ingredient Resources
        ('[ "create" ]', '[ "ingredients" ]', '{
            "subject_type": "user"
        }', 'Permission to [create] user [ingredient] resources'),
        -- Read Own Ingredient Resources
        ('[ "read" ]', '[ "ingredients" ]', '{
            "document.variant": "User Ingredient",
            "document.user": "USER_ID",
            "action_type": { "$in": [ "public", "private" ] }
        }', 'Permission to [read] own [ingredient] resources'),
        -- Modify Own Ingredient Resources
        ('[ "update", "delete" ]', '[ "ingredients" ]', '{
            "document.variant": "User Ingredient",
            "document.user": "USER_ID"
        }', 'Permission to [update, delete] own [ingredient] resources'),
        -- Read Verified Ingredient Resources (Public)
        ('[ "read" ]', '[ "ingredients" ]', '{
            "document.variant": "Verified Ingredient",
            "action_type": "public"
        }', 'Permission to [read] verified [ingredient] resources (Public)'),
        -- Read Verified Ingredient Resources (Private)
        ('[ "read" ]', '[ "ingredients" ]', '{
            "document.variant": "Verified Drinkware",
            "action_type": "private"
        }', 'Permission to [read] verified [ingredient] resources (Private)'),
        -- Modify Verified Ingredient Resources
        ('[ "update", "delete" ]', '[ "ingredients" ]', '{
            "document.variant": "Verified Ingredient"
        }', 'Permission to [update, delete] verified [ingredient] resources'),
        -- Read 'Public' User Ingredient Resources (Public)
        ('[ "read" ]', '[ "ingredients" ]', '{
            "document.variant": "User Ingredient",
            "document.public": true,
            "action_type": "public"
        }', 'Permission to [read] public user [ingredient] resources (Public)'),
        -- Read 'Public' User Ingredient Resources (Private)
        ('[ "read" ]', '[ "ingredients" ]', '{
            "document.variant": "User Ingredient",
            "document.public": true,
            "action_type": "private"
        }', 'Permission to [read] public user [ingredient] resources (Private)'),
        -- Modify 'Public' User Ingredient Resources
        ('[ "update", "delete" ]', '[ "ingredients" ]', '{
            "document.variant": "User Ingredient",
            "document.public": true
        }', 'Permission to [update, delete] public user [ingredient] resources'),
    -- Drink Permissions
        -- Create Verified Drink Resources
        ('[ "create" ]', '[ "drinks" ]', '{
            "subject_type": "verified"
        }', 'Permission to [create] verified [drink] resources'),
        -- Create User Drink Resources
        ('[ "create" ]', '[ "drinks" ]', '{
            "subject_type": "user"
        }', 'Permission to [create] user [drink] resources'),
        -- Read Own Drink Resources
        ('[ "read" ]', '[ "drinks" ]', '{
            "document.variant": "User Drink",
            "document.user": "USER_ID",
            "action_type": { "$in": [ "public", "private" ] }
        }', 'Permission to [read] own [drink] resources'),
        -- Modify Own Drink Resources
        ('[ "update", "delete" ]', '[ "drinks" ]', '{
            "document.variant": "User Drink",
            "document.user": "USER_ID"
        }', 'Permission to [update, delete] own [drink] resources'),
        -- Read Verified Drink Resources (Public)
        ('[ "read" ]', '[ "drinks" ]', '{
            "document.variant": "Verified Drink",
            "action_type": "public"
        }', 'Permission to [read] verified [drink] resources (Public)'),
        -- Read Verified Drink Resources (Private)
        ('[ "read" ]', '[ "drinks" ]', '{
            "document.variant": "Verified Drinkware",
            "action_type": "private"
        }', 'Permission to [read] verified [drink] resources (Private)'),
        -- Modify Verified Drink Resources
        ('[ "update", "delete" ]', '[ "drinks" ]', '{
            "document.variant": "Verified Drink"
        }', 'Permission to [update, delete] verified [drink] resources'),
        -- Read 'Public' User Drink Resources (Public)
        ('[ "read" ]', '[ "drinks" ]', '{
            "document.variant": "User Drink",
            "document.public": true,
            "action_type": "public"
        }', 'Permission to [read] public user [drink] resources (Public)'),
        -- Read 'Public' User Drink Resources (Private)
        ('[ "read" ]', '[ "drinks" ]', '{
            "document.variant": "User Drink",
            "document.public": true,
            "action_type": "private"
        }', 'Permission to [read] public user [drink] resources (Private)'),
        -- Modify 'Public' User Drink Resources
        ('[ "update", "delete" ]', '[ "drinks" ]', '{
            "document.variant": "User Drink",
            "document.public": true
        }', 'Permission to [update, delete] public user [drink] resources')

        -- Add Media Permissions
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
    (@editor_role_id, 44),
    (@editor_role_id, 45),
    (@editor_role_id, 46),

    (@user_role_id, 3),
    (@user_role_id, 4),
    (@user_role_id, 5),
    (@user_role_id, 6),
    (@user_role_id, 8),
    (@user_role_id, 9),
    (@user_role_id, 10),
    (@user_role_id, 11),
    (@user_role_id, 14),
    (@user_role_id, 18),
    (@user_role_id, 19),
    (@user_role_id, 20),
    (@user_role_id, 21),
    (@user_role_id, 24),
    (@user_role_id, 28),
    (@user_role_id, 29),
    (@user_role_id, 30),
    (@user_role_id, 31),
    (@user_role_id, 34),
    (@user_role_id, 38),
    (@user_role_id, 39),
    (@user_role_id, 40),
    (@user_role_id, 41),
    (@user_role_id, 44),

    (@guest_role_id, 2),
    (@guest_role_id, 6),
    (@guest_role_id, 11),
    (@guest_role_id, 14),
    (@guest_role_id, 21),
    (@guest_role_id, 24),
    (@guest_role_id, 31),
    (@guest_role_id, 34),
    (@guest_role_id, 41),
    (@guest_role_id, 44)
;