// http://www.blankwebsite.com
// https://example.com

( async function () {
  'use strict';

  GM_xmlhttpRequest( {
    method: 'GET',
    url: 'https://www.gaymaletube.com/out/?l=3AASGc4YWliRq1FDRDY5ZEljMXNpAtl2aHR0cHM6Ly93d3cuYmZodWIuY29tL3ZpZGVvcy8xMjk3MjQ3L2NoaW5lc2UtZnVja2luZy1hdC10aGFpLWdheS1zYXVuYS8/dXRtX3NvdXJjZT1hd24mdXRtX21lZGl1bT10Z3AmdXRtX2NhbXBhaWduPWNwY80BlaJ0YwFFpGRhdGVA2St7ImFsbCI6IiIsIm9yaWVudGF0aW9uIjoiZ2F5IiwicHJpY2luZyI6IiJ9Hc5nakrLqGNhdGVnb3J5zgABkdfA2XxbeyIxIjoiSW0zOUVadDBoSWMifSx7IjIiOiJMdXBBVElyNlhhVCJ9LHsiMyI6IlBxOVRWZnM3UzVjIn0seyItMSI6IkE1eTRTUzQyZUtPIn0seyItMiI6IkJENEYxdWx2bno2In0seyItMyI6IjZkbEc4NFQ3Q0t0In1d&c=894f563f&v=3&',
    responseType: 'document',
    onload: function ( response ) {
      console.log( response );
    }
  } );

} )();
