SELECT
  `blog`.`nanoid` AS `blog_nanoid`,
  `blog`.`type` AS `blog_type`,
  `blog`.`title` AS `blog_title`,
  `blog`.`pics` AS `blog_pics`,
  `blog`.`tag_name` AS `blog_tag_name`,
  `blog`.`tag_color` AS `blog_tag_color`,
  `blog`.`publish_date` AS `blog_publish_date`,
  `blog`.`update_date` AS `blog_update_date`,
  `user`.`user_id` AS `user_user_id`,
  `user`.`user_name` AS `user_user_name`,
  `user`.`password` AS `user_password`,
  `user`.`role` AS `user_role`,
  `user`.`avatar` AS `user_avatar`,
  `user`.`create_date` AS `user_create_date`,
  `user`.`unuse` AS `user_unuse`,
  `user`.`user_name` as blog_author
FROM
  `blogs` `blog`
  INNER JOIN `users` `user` ON `user`.`user_id` = `blog`.`author`
WHERE
  `blog`.`unuse` = ?
  AND `blog`.`audit` = ?
ORDER BY
  update_date DESC
