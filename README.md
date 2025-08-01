Hides suggested videos at the end of youtube videos by creating an overlay.


## How To Use:
### How to Add it
Go to Hubsput > Website Pages > Settings > Advanced




Where: Hubspot > Website Pages > Settings > Advanced

Add this to HEAD HTML:
-- Copy and paste contents of styles.html
Add this to footer HTML:
-- <script src='{{ get_asset_url('/hideSuggestedVideos.js') }}'></script>


How to disable:
Remove CSS: Delete content of Head HTML in Settings
Remove Code: Delete the script line in Footer HTML
