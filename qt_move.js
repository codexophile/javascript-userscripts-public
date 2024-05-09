var qs = new ActiveXObject( "QTTabBarLib.Scripting" );
var wnd = qs.ActiveWindow;
var tab = wnd.ActiveTab;
var sel = tab.selectedItems;
var fso = new ActiveXObject( "Scripting.FileSystemObject" );


for( var i = 0; i < sel.Count; i++ ) {
    
    var path = sel.Item( i );
    var name_ = fso.GetBaseName( path );
    var dest = "";
    // qs.Alert( path );

    if( name_.indexOf( "[tik]" ) ) {
        dest = "V:\\V\\Musical.ly\\";
        qs.InvokeCommand( "MoveFile", path, dest );
        qs.Sleep( 1000 );
    }

}