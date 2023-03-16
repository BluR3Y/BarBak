CREATE DATABASE barbak;
USE barbak;

-- Tools

CREATE TABLE tool_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO tool_categories (`name`) VALUES
    ('mixing'),
    ('measuring'),
    ('stirring'),
    ('muddling'),
    ('straining'),
    ('opening'),
    ('serving'),
    ('pouring'),
    ('garnishing'),
    ('cutting'),
    ('chilling'),
    ('cleaning'),
    ('other')
;


-- Materials

CREATE TABLE barware_material_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

INSERT INTO barware_material_categories (`name`) VALUES
    ('glassware'),
    ('ceramicware'),
    ('metalware'),
    ('plasticware'),
    ('woodenware'),
    ('other');
;

CREATE TABLE barware_materials (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `category_id` INT(6) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
    FOREIGN KEY (`category_id`) REFERENCES barware_material_categories (`id`)
);

INSERT INTO barware_materials (`category_id`, `name`) VALUES
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'glass'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'crystal'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'soda lime'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'borosilicate'),
    ((SELECT id FROM barware_material_categories WHERE name = 'glassware'), 'tempered'),

    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'ceramic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'clay'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'porcelain'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'earthenware'),
    ((SELECT id FROM barware_material_categories WHERE name = 'ceramicware'), 'stoneware'),

    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'metal'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'stainless steel'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'brass'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'aluminum'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'titanium'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'copper'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'pewter'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'silver'),
    ((SELECT id FROM barware_material_categories WHERE name = 'metalware'), 'gold'),

    ((SELECT id FROM barware_material_categories WHERE name = 'plastic'), 'plastic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plastic'), 'Polycarbonate'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plastic'), 'acrylic'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plastic'), 'tritan'),
    ((SELECT id FROM barware_material_categories WHERE name = 'plastic'), 'polypropylene'),

    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'wood'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'oak'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'maple'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'cherry'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'teak'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'olive'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'pine'),
    ((SELECT id FROM barware_material_categories WHERE name = 'woodenware'), 'walnut'),

    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'graphite'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'silicone'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'bamboo'),
    ((SELECT id FROM barware_material_categories WHERE name = 'other'), 'paper'),
;

-- Ingredients

CREATE TABLE ingredient_categories (
    `id` INT(6) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE ingredient_sub_categories (
    
)