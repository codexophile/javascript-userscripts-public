'use strict';

const arr = location.href.split( '/' );
const lastSegment = arr.pop();
const baseSegment = arr.join( '/' );
const isMalformed = lastSegment.includes('%');
if (!isMalformed) return;
const proper = decodeURIComponent(lastSegment);
location.replace(`${baseSegment}/${proper}`);
