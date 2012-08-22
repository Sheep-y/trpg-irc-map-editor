<?php

$config = array(
  'db_host' => 'localhost',
  'db_name' => 'dndtools',
  'db_prefix' => 'sheepy_',
  'db_user' => 'root',
  'db_pass' => '',
);

// Load/override settings if config file exists
if ( file_exists('config.php') ) include('config.php');

$out = array(
  'app_version' => '20120822',
);

function escJS( $str ) {
  $str = str_replace("\\", "\\\\", $str);
  $str = str_replace("\r", "\\r", $str);
  $str = str_replace("\n", "\\n", $str);
  $str = str_replace('"', '\\"', $str);
  $str = str_replace("'", "\\'", $str);
  return $str;
}

function conn() {
  global $config;
  $conn = mysql_connect( $config['db_host'], $config['db_user'], $config['db_pass'] );
  if ( !$conn ) {
    echo 'ERROR 0x10: Cannot connect to database.';
    die;
  }
  mysql_query( "SET NAMES 'UTF8'" );
  if ( !mysql_select_db( $config['db_name'] ) ) {
    echo 'ERROR 0x11: Database not found.';
    mysql_close( $conn );
    die;
  }
  return $conn;
}

function list_map() {
  global $config;

  // Connect and escape strings
  $table = $config['db_prefix'].'arena_syncmap';
  $conn = @conn();
  
  // Delete old maps and then list maps
  @mysql_query("DELETE FROM $table WHERE mtime < DATE_SUB(NOW(), INTERVAL 3 MONTH)"); 
  $res = @mysql_query("SELECT id, title FROM $table ORDER BY mtime DESC");
  if ( !$res ) {
    echo 'ERROR 0x12: '.mysql_error();
    return mysql_close( $conn );
  }
  
  // Output maps
  echo 'OK:{"maps":{';
  $result = mysql_fetch_assoc( $res );
  $i = 0;
  while ($result) {
    if ( $i++ > 0 ) echo ",";
    echo '"'.$result['id'].'":"'.escJS($result['title']).'"';
    $result = mysql_fetch_assoc( $res );
  }
  echo '}}';
  mysql_free_result( $res );
  
  // Cleanup
  mysql_close( $conn );
}


function sync_map() {
  global $config;

  // Check parameters  
  $id = (int) @$_REQUEST['id'];
  $etag = (int) @$_REQUEST['etag'];
  $master_password = trim( @$_REQUEST['pass'] );
  if ( $id <= 0 ) {
    echo 'ERROR 0x03: Please provide id and password.';
    die;
  }
  /*
  $headers = apache_request_headers();
  if ( !empty( $headers['If-None-Match'] ) )
    $etag = $headers['If-None-Match'];
  */ 
  
  // Connect and escape strings
  $table = $config['db_prefix'].'arena_syncmap';
  $conn = @conn();
  $master_password = hash('whirlpool', $master_password );
  
  // Check for existing map with given id
  $res = @mysql_query("SELECT id, UNIX_TIMESTAMP(mtime) etag, viewer_password, data 
    FROM $table WHERE id=$id" );
  if ( !$res ) {
    echo 'ERROR 0x12: '.mysql_error();
    return mysql_close( $conn );
  }
  $result = mysql_fetch_assoc( $res );
  mysql_free_result( $res );
  
  // Delete if exists and password ok, error otherwise
  if ( !$result || $result['viewer_password'] != $master_password ) {
    echo 'ERROR 0x0C: Map not found or incorrect password.';
  } else {
    if ( $result['etag'] == $etag ) {
      header("HTTP/1.1 304 Not Modified");
    } else {
      ini_set("zlib.output_compression", 8192);
      header( "ETag: $result[etag]" );
      echo "OK:".$result['data'];
    }
  }
  
  // Cleanup
  mysql_close( $conn );  
}


function share_map() {
  global $config;
  // Check parameters  
  $title = trim( @$_REQUEST['title'] );
  $master_password = trim( @$_REQUEST['master'] );
  $viewer_password = trim( @$_REQUEST['viewer'] );
  $data = @$_REQUEST['data'];
  if (!$title || !$master_password || !$data) {
    echo 'ERROR 0x01: Please provide title, master password, and data.';
    die;
  }
  if ( $master_password == $viewer_password ) {
    echo 'ERROR 0x02: Master password must not be same with viewer password.';
    die;
  }
  
  // Connect and escape strings
  $table = $config['db_prefix'].'arena_syncmap'; 
  $conn = @conn();
  $title = @mysql_real_escape_string( $title );
  $data = @mysql_real_escape_string( $data ); 
  $master_password = hash('whirlpool', $master_password );
  $viewer_password = hash('whirlpool', $viewer_password );
  
  // Lock table and check for existing map with same title
  @mysql_query( "LOCK TABLES $table WRITE" );
  $res = @mysql_query("SELECT id, master_password FROM $table WHERE title='$title'");
  if ( !$res ) {
    mysql_query( "UNLOCK TABLES" );
    echo 'ERROR 0x12: '.mysql_error();
    return mysql_close( $conn );
  }
  $result = mysql_fetch_assoc( $res );
  mysql_free_result( $res );

  // Insert if ok, error if exists
  if ( $result && $result['master_password'] != $master_password ) {
    echo 'ERROR 0x0B: Map exists';
  } else {
    if ( $result ) {
      mysql_query("UPDATE $table 
                   SET title='$title', ctime=NOW(), mtime=NOW(),
                       viewer_password='$viewer_password', data='$data'
                   WHERE id=$result[id]"); 
      echo "OK:$result[id]";
    } else {
      mysql_query("INSERT INTO $table (title, ctime, mtime, master_password, viewer_password, data)
                   VALUES ('$title', NOW(), NOW(), '$master_password', '$viewer_password', '$data' )"); 
      echo "OK:".mysql_insert_id();
    }
  }
  
  // Cleanup
  mysql_query( "UNLOCK TABLES" );
  mysql_close( $conn );
}


function unshare_map() {
  global $config;

  // Check parameters  
  $id = (int) @$_REQUEST['id'];
  $master_password = trim( @$_REQUEST['pass'] );
  if ( $id <= 0 || !$master_password ) {
    echo 'ERROR: Please provide id and password. (0x03)';
    die;
  }
  
  // Connect and escape strings
  $table = $config['db_prefix'].'arena_syncmap';
  $conn = @conn();
  $master_password = hash('whirlpool', $master_password );
  
  // Check for existing map with given id
  $res = @mysql_query("SELECT id, master_password FROM $table WHERE id=$id");
  if ( !$res ) {
    echo 'ERROR 0x12: '.mysql_error();
    return mysql_close( $conn );
  }
  $result = mysql_fetch_assoc( $res );
  mysql_free_result( $res );
  
  // Delete if exists and password ok, error otherwise
  if ( !$result || $result['master_password'] != $master_password ) {
    echo 'ERROR 0x0C: Map not found or incorrect password.';
  } else {
    mysql_query("DELETE FROM $table WHERE id=$result[id]"); 
    echo "OK";
  }
  
  // Cleanup
  mysql_close( $conn );
}

/**
 * Load a template.
 * @param $name Template name without path and extension.
 */
function template_load($name) {
  global $out;
  $result = file_get_contents("html/$name.html");
  $result = str_replace('../html/', 'html/', $result);
  $result = str_replace('[var.out.app_version]', $out['app_version'], $result);
  return $result;
}

?>
