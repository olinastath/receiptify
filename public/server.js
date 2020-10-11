(function () {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */

	var displayName = 'RECEIPTIFY';
	var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	var today = new Date();

	var userProfileSource = document.getElementById('user-profile-template').innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById('receipt');

	Handlebars.registerHelper('parseIndex', function(value, options) {
		if (value < 9) {
			return '0' + (parseInt(value) + 1);
		} else {
			return parseInt(value) + 1;
		}
	});

	function getHashParams() {
		var hashParams = {};
		var e,
			r = /([^&;=]+)=?([^&;]*)/g,
			q = window.location.hash.substring(1);
		while ((e = r.exec(q))) {
			hashParams[e[1]] = decodeURIComponent(e[2]);
		}
		return hashParams;
	}

	function toCamelCase(str) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
	}

	function toggleFilterDisplay(type, array, showWarning) {
		const node = document.getElementById(type);
		node.innerHTML = '';

		if (array.length > 0) {
			let text = document.createElement('H3');
			text.innerText = 'Hiding: ' + array.join(', ');
			node.appendChild(text);
		}

		if (showWarning) {
			let warning = document.createElement('H3');
			warning.innerHTML = 'Looks like you hid most of your top songs. <br/> Try again with fewer filters.'
			warning.className = 'warning';
			node.appendChild(warning);
		}
	}

	function populateAndDisplayNode(type, array) {
		const node = document.getElementById(type);
		node.innerHTML = '';

		for (let i = 0; i < array.length; i++) {
			let displayName = array[i];
			let value = array[i].split(' - ')[0].trim()
			let albumName = value.split('(')[0].trim()

			let divElement = document.createElement('DIV');
			divElement.className = 'hide-element';

			let inputElement = document.createElement('INPUT');
			inputElement.setAttribute('type', 'checkbox');
			inputElement.setAttribute('name', toCamelCase(albumName));
			inputElement.setAttribute('id', toCamelCase(albumName));
			inputElement.setAttribute('value', value);
			divElement.appendChild(inputElement);

			let labelElement = document.createElement('LABEL');
			labelElement.setAttribute('for', toCamelCase(albumName));
			labelElement.innerText = displayName;
			divElement.appendChild(labelElement);
			
			node.appendChild(divElement);
		}

		const hideOptionsChildren = document.getElementsByClassName('hide-options-row')[1].children;
		for (let i = 0; i < hideOptionsChildren.length; i++) {
			if (hideOptionsChildren[i].id !== type) {
				hideOptionsChildren[i].style.display = 'none';
			} else {
				hideOptionsChildren[i].style.display = 'flex';
			}
		}
	}

	function loadInitialTracks() {
		const timeRangeSlugs = ['short_term', 'medium_term', 'long_term'];
		const artists = [];
		const albums = [];
		timeRangeSlugs.forEach(timeRangeSlug => {
			$.ajax({
				url: `https://api.spotify.com/v1/me/top/tracks?limit=25&time_range=${timeRangeSlug}`,
				headers: {
					Authorization: 'Bearer ' + access_token
				},
				success: function (response) {
					response.items.forEach(track => {
						if (!albums.includes(`${track.album.name} - ${track.album.artists[0].name}`)) {
							albums.push(`${track.album.name} - ${track.album.artists[0].name}`);
						}

						for (let i = 0; i < track.artists.length; i++) {
							if (!artists.includes(track.artists[i].name)) {
								artists.push(track.artists[i].name);
							}
						}
					
					});
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					// error handler here
				}
			});
		});

		document.getElementById('artists_btn').addEventListener('click', () => populateAndDisplayNode('artists', artists));
		document.getElementById('albums_btn').addEventListener('click', () => populateAndDisplayNode('albums', albums));
	}

	function retrieveTracks(timeRangeSlug, domNumber, domPeriod) {
		// get the checked artists and albums and make sure to check against those
		let skipAlbums = Array.from(document.querySelectorAll('#albums .hide-element input:checked')).map(ele => ele.value);
		let skipArtists = Array.from(document.querySelectorAll('#artists .hide-element input:checked')).map(ele => ele.value);

		$.ajax({
			url: `https://api.spotify.com/v1/me/top/tracks?limit=25&time_range=${timeRangeSlug}`,
			headers: {
				Authorization: 'Bearer ' + access_token
			},
			success: function (response) {
				var data = {
					trackList: [],
					total: 0,
					parsedSongs: 0,
					date: today.toLocaleDateString('en-US', dateOptions).toUpperCase(),
					json: true
				};
				for (var i = 0; i < response.items.length; i++) {
					let currentTrack = response.items[i];
					if (!skipAlbums.includes(currentTrack.album.name) && 
					!currentTrack.artists.some(artist => skipArtists.includes(artist.name))) {
						for (var j = 0; j < currentTrack.artists.length; j++) {
							currentTrack.artists[j].name = currentTrack.artists[j].name.trim().toUpperCase();
							if (j != currentTrack.artists.length - 1) {
								currentTrack.artists[j].name = currentTrack.artists[j].name + ', ';
							}
						}

						currentTrack.name = currentTrack.name.toUpperCase();
						data.total += currentTrack.duration_ms;
						let minutes = Math.floor(currentTrack.duration_ms / 60000);
						let seconds = ( (currentTrack.duration_ms % 60000) / 1000).toFixed(0);
						currentTrack.duration_ms = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
						data.parsedSongs++;
						data.trackList.push(currentTrack);
						if (data.parsedSongs === 10) {
							break;
						}
					}
				}
				minutes = Math.floor(data.total / 60000);
				seconds = ((data.total % 60000) / 1000).toFixed(0);
				data.total = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
				userProfilePlaceholder.innerHTML = userProfileTemplate({
					tracks: data.trackList,
					total: data.total,
					time: data.date,
					num: domNumber,
					name: displayName,
					period: domPeriod,
					parsedSongs: data.parsedSongs
				});

				toggleFilterDisplay('albums', skipAlbums, data.parsedSongs < 10);
				toggleFilterDisplay('artists', skipArtists, data.parsedSongs < 10);

				document.getElementById('download').addEventListener('click', function () {
					var offScreen = document.querySelector('.receiptContainer');

					window.scrollTo(0, 0);
					// Use clone with htm2canvas and delete clone
					html2canvas(offScreen).then((canvas) => {
						var dataURL = canvas.toDataURL();
						console.log(dataURL);
						var link = document.createElement('a');
						link.download = `${timeRangeSlug}_receiptify.png`;
						link.href = dataURL;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						delete link;
					});
				});
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				// error handler here
			}
		});
	}

	var params = getHashParams();

	var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error;

	if (error) {
		alert('There was an error during the authentication');
	} else {
		if (access_token) {
			$.ajax({
				url: 'https://api.spotify.com/v1/me',
				headers: {
					Authorization: 'Bearer ' + access_token
				},
				success: function (response) {
					displayName = response.display_name.toUpperCase();
					$('#login').hide();
					$('#loggedin').show();
				}
			});
			loadInitialTracks();
		} else {
			// render initial screen
			$('#login').show();
			$('#loggedin').hide();
		}

		document.getElementById('short_term').addEventListener('click', () => retrieveTracks('short_term', 1, 'LAST MONTH'), false);
		document.getElementById('medium_term').addEventListener('click', () => retrieveTracks('medium_term', 2, 'LAST 6 MONTHS'), false);
		document.getElementById('long_term').addEventListener('click', () => retrieveTracks('long_term', 3, 'ALL TIME'), false);
	}
})();
