Travel quiz
================================================


This is a simple clone of the [mapTrouveTout](https://github.com/gulhe/mapTrouveTout) which is a hand-made version of
[geoguessr](https://www.geoguessr.com/) website.

The difference between this repository and mapTrouveTout is that travelquiz doesn't use Google's Panorama API, but 
actual images taken along some past trips.

There is no backend/webservice delivering on the fly the images, reason why they are all stored along with the 
repository.

In order to change the images with your own, remove the content of ```img/photos``` directory and adapt the content 
of the file ```js/coordinates.js``` (which contains the image metadata).

Demo is available here [http://mariusneo.github.io/travelquiz/](http://mariusneo.github.io/travelquiz/).