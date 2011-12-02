CREATE TABLE IF NOT EXISTS `sheepy_arena_syncmap` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `ctime` datetime NOT NULL,
  `mtime` datetime NOT NULL,
  `master_password` char(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `viewer_password` char(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `data` longblob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mtime` (`mtime`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=14 ;
