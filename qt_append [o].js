var qs = new ActiveXObject( "QTTabBarLib.Scripting" );
var wnd = qs.ActiveWindow;
var tab = wnd.ActiveTab;
var sel = tab.selectedItems;
var fso = new ActiveXObject( "Scripting.FileSystemObject" );

for( var i = 0; i < sel.Count; i++ ) {

    var path = sel.Item( i );
    var name_ = fso.GetBaseName( path );
    var ext_ = fso.GetExtensionName( path );
    
    var newName = name_ + " [o]" + "." + ext_;
    // qs.Alert( newName );
    qs.InvokeCommand( "Rename", path, newName )

}