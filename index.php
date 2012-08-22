<?php

require('php/arena.php');

$action = empty( $_REQUEST['ajax'] ) ? '' : strtolower( $_REQUEST['ajax'] );

header('Content-Type', 
  $action 
   ? 'text/plain; charset=utf-8'  
   : 'text/html; charset=utf-8' );

if ( $action == 'sync' ) {
  sync_map();
  
} else if ( $action == 'list' ) {
  list_map();

} else if ( $action == 'share' ) {
  share_map();
  
}else if ( $action == 'unshare' ) {
  unshare_map();

} else {
  /* Load and display map */
  echo template_load('map_template');
}

?>
