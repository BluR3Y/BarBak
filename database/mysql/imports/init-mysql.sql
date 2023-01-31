USE barbak;

CREATE TABLE categorical_data (
	`category_id` INT NOT NULL AUTO_INCREMENT,
    -- For the type of category, ex: drinks, ingredients, drinkware, etc
    `category_group` VARCHAR(50) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
	PRIMARY KEY(`category_id`)
);

CREATE TABLE categorical_data_item (
	`category_item_id` INT NOT NULL AUTO_INCREMENT,
    `category_id` INT NOT NULL,
    `data` VARCHAR(50) NOT NULL,
    PRIMARY KEY(`category_item_id`),
    FOREIGN KEY(`category_id`) REFERENCES categorical_data(`category_id`)
);

CREATE TABLE categorical_sub_data_item (
	`categorical_sub_item_id` INT NOT NULL AUTO_INCREMENT,
    `category_item_id` INT NOT NULL,
    `data` VARCHAR(50) NOT NULL,
    PRIMARY KEY(`categorical_sub_item_id`),
    FOREIGN KEY(`category_item_id`) REFERENCES categorical_data_item(`category_item_id`)
);

INSERT INTO categorical_data (category_group, category) VALUES 
	('tools','tool_types'),
    ('tools', 'tool_materials'),
    ('ingredients', 'ingredient_types'),
    ('drinkware', 'drinkware_materials'),
    ('drinks', 'drink_preparation_methods'),
    ('drinks', 'drink_serving_styles'),
    ('drinks', 'drink_measurement_units')
;


INSERT INTO categorical_data_item (category_id, data) VALUES
	((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'mixing'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'measuring'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'stirring'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'muddling'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'straining'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'opening'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'serving'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'pouring'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'garnishing'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'cutting'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'),'chilling'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_types'), 'cleaning'),
    
	((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'stainless steel'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'brass'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'wood'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'plastic'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'aluminum'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'silicone'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'glass'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'ceramic'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'titanium'),
    ((SELECT category_id FROM categorical_data WHERE category = 'tool_materials'), 'graphite'),
    
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'liquor'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'liqueur'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'beer'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'wine'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'mixer'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'enhancer'),
    ((SELECT category_id FROM categorical_data WHERE category = 'ingredient_types'), 'fruit'),
    
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'crystal'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'wood'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'glass'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'stainless steel'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'ceramic'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'copper'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'bamboo'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'silicone'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'acrylic'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drinkware_materials'), 'paper'),
    
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'stir'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'shake'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'blend'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'build'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'muddle'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'layer'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'flame'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'churn'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'carbonate'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'infuse'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'smoke'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'spherify'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'swizzle'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_preparation_methods'), 'roll'),
    
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_serving_styles'), 'neat'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_serving_styles'), 'straight-up'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_serving_styles'), 'on the rocks'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_serving_styles'), 'straight'),
    ((SELECT category_id FROM categorical_data WHERE category = 'drink_serving_styles'), 'chilled')

	-- Missing Units of measurement
;

-- CREATE TABLE categorical_data (
-- 	`category_id` INT NOT NULL AUTO_INCREMENT,
--     -- For the type of category, ex: drinks, ingredients, drinkware, etc
--     `category_group` VARCHAR(50) NOT NULL,
--     `category` VARCHAR(50) NOT NULL,
-- 	PRIMARY KEY(`category_id`)
-- );

-- CREATE TABLE categorical_data_item (
-- 	`category_item_id` INT NOT NULL AUTO_INCREMENT,
--     `category_id` INT NOT NULL,
--     `data` VARCHAR(50) NOT NULL,
--     PRIMARY KEY(`category_item_id`),
--     FOREIGN KEY(`category_id`) REFERENCES categorical_data(`category_id`)
-- );

-- CREATE TABLE categorical_sub_data_item (
-- 	`categorical_sub_item_id` INT NOT NULL AUTO_INCREMENT,
--     `category_item_id` INT NOT NULL,
--     `data` VARCHAR(50) NOT NULL,
--     PRIMARY KEY(`categorical_sub_item_id`),
--     FOREIGN KEY(`category_item_id`) REFERENCES categorical_data_item(`category_item_id`)
-- );

INSERT INTO categorical_sub_data_item (category_item_id, data) VALUES
	((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'whiskey'),
	((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'gin'),
	((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'vodka'),
	((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'rum'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'tequila'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liquor'), 'brandy'),
    
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'orange'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'coffee'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'cream'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'nut'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'herb'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'liqueur'), 'fruit'),
    
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'lager'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'ale'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'wheat'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'stout'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'porter'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'sour'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'beer'), 'belgia'),
    
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'wine'), 'red'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'wine'), 'white'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'wine'), 'rose'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'wine'), 'sparkling'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'wine'), 'fortified'),
    
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'mixer'), 'juice'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'mixer'), 'syrup'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'mixer'), 'soda'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'mixer'), 'dairy'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'mixer'), 'teas'),

    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'enhancer'), 'spice'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'enhancer'), 'herb'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'enhancer'), 'salt'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'enhancer'), 'bitter'),
    
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'citrus'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'berries'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'melons'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'tropical'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'stone'),
    ((SELECT category_item_id FROM categorical_data_item WHERE category_id = (SELECT category_id FROM categorical_data WHERE category_group = 'ingredients' AND category = 'ingredient_types') AND data = 'fruit'), 'pome')
;