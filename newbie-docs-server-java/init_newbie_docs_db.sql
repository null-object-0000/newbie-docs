USE `newbie_site`;

/******************************************/
/*   DatabaseName = newbie_site   */
/*   TableName = newbie_books   */
/******************************************/
DROP TABLE IF EXISTS `newbie_books`;
CREATE TABLE `newbie_books`
(
    `id`          bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `slug`        varchar(50)     NOT NULL DEFAULT '' COMMENT '路由标识',
    `cover`       varchar(50)     NOT NULL DEFAULT '' COMMENT '封面图',
    `title`       varchar(50)     NOT NULL DEFAULT '' COMMENT '标题',
    `description` varchar(50)     NOT NULL DEFAULT '' COMMENT '描述',
    `creator`     varchar(50)     NOT NULL DEFAULT '' COMMENT '创建人',
    `updater`     varchar(50)     NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time` datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime        NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '更新时间',
    `sort`        int             NOT NULL DEFAULT '-1' COMMENT '排序值',
    `is_deleted`  tinyint         NOT NULL DEFAULT '0' COMMENT '是否已被删除（0 未删除 1 已删除）',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb3
;

/******************************************/
/*   DatabaseName = newbie_site   */
/*   TableName = newbie_docs   */
/******************************************/
DROP TABLE IF EXISTS `newbie_docs`;
CREATE TABLE `newbie_docs`
(
    `id`          bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `slug`        varchar(50)     NOT NULL DEFAULT '' COMMENT '路由标识',
    `book_id`     bigint unsigned NOT NULL DEFAULT '0' COMMENT '所属书籍',
    `book_slug`   varchar(50)     NOT NULL DEFAULT '' COMMENT '所属书籍路由标识',
    `parent_id`   bigint unsigned NOT NULL DEFAULT '0' COMMENT '父级目录',
    `parent_slug` varchar(50)     NOT NULL DEFAULT '' COMMENT '父级目录路由标识',
    `title`       varchar(50)     NOT NULL DEFAULT '' COMMENT '标题',
    `editor`      int             NOT NULL DEFAULT '0' COMMENT '1 word 2 block 3 link',
    `content`     longtext        NOT NULL COMMENT '内容',
    `creator`     varchar(50)     NOT NULL DEFAULT '' COMMENT '创建人',
    `updater`     varchar(50)     NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time` datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime        NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '更新时间',
    `sort`        int             NOT NULL DEFAULT '-1' COMMENT '排序值',
    `is_deleted`  tinyint         NOT NULL DEFAULT '0' COMMENT '是否已被删除（0 未删除 1 已删除）',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb3
;

/******************************************/
/*   DatabaseName = newbie_site   */
/*   TableName = newbie_permissions   */
/******************************************/
DROP TABLE IF EXISTS `newbie_permissions`;
CREATE TABLE `newbie_permissions`
(
    `id`          bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键标识',
    `auth_type`   int             NOT NULL DEFAULT 0 COMMENT '权限类型（1 adminer 2 editor 3 viewer）',
    `data_type`   int             NOT NULL DEFAULT 0 COMMENT '数据类型（1 book 2 doc）',
    `data_id`     bigint unsigned NOT NULL DEFAULT 0 COMMENT '数据标识',
    `data_slug`   varchar(50)     NOT NULL DEFAULT '' COMMENT '数据路由标识',
    `owner`       varchar(50)     NOT NULL DEFAULT '' COMMENT '所有者',
    `owner_type`  int             NOT NULL DEFAULT 0 COMMENT '所有者类型（1 user 2 department）',
    `creator`     varchar(50)     NOT NULL DEFAULT '' COMMENT '创建人',
    `updater`     varchar(50)     NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time` datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime        NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '更新时间',
    `is_deleted`  tinyint         NOT NULL DEFAULT '0' COMMENT '是否已被删除（0 未删除 1 已删除）',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb3
;
