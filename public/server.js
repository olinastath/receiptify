(function () {
	/**
	 * Obtains parameters from the hash of the URL
	 * @return Object
	 */

	var displayName = "RECEIPTIFY";
	var dateOptions = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	var today = new Date();

	var userProfileSource = document.getElementById("user-profile-template")
			.innerHTML,
		userProfileTemplate = Handlebars.compile(userProfileSource),
		userProfilePlaceholder = document.getElementById("receipt");

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

	function populateAndDisplayNode(type, map) {
		const node = document.getElementById(type);
		node.innerHTML = "";

		for (let i = 0; i < Object.keys(map).length; i++) {
			let key = Object.keys(map)[i];
			let name = map[key];
			let value = map[key].split(" - ")[0].trim();

			let divElement = document.createElement("DIV");
			divElement.className = "hide-element";

			let inputElement = document.createElement("INPUT");
			inputElement.setAttribute("type", "checkbox");
			inputElement.setAttribute("name", toCamelCase(name));
			inputElement.setAttribute("id", toCamelCase(name));
			inputElement.setAttribute("value", value);
			divElement.appendChild(inputElement);

			let labelElement = document.createElement("LABEL");
			labelElement.setAttribute("for", toCamelCase(name));
			labelElement.innerText = name;
			divElement.appendChild(labelElement);
			
			node.appendChild(divElement);
		}

		const hideOptionsChildren = document.getElementsByClassName("hide-options-row")[1].children;
		for (let i = 0; i < hideOptionsChildren.length; i++) {
			if (hideOptionsChildren[i].id !== type) {
				hideOptionsChildren[i].style.display = 'none';
			} else {
				hideOptionsChildren[i].style.display = 'flex';
			}
		}
	}

	function loadInitialTracks() {
		const timeRangeSlugs = ["short_term", "medium_term", "long_term"];
		const artists = {};
		const albums = {};
		timeRangeSlugs.forEach(timeRangeSlug => {
			$.ajax({
				url: `https://api.spotify.com/v1/me/top/tracks?limit=25&time_range=${timeRangeSlug}`,
				headers: {
					Authorization: "Bearer " + access_token,
				},
				async: false,
				success: function (response) {
					response.items.forEach(track => {
						if (!albums[track.album.name]) {
							albums[track.album.name] = `${track.album.name} - ${track.album.artists[0].name}`;
						}

						for (let i = 0; i < track.artists.length; i++) {
							if (!artists[track.artists[i].name]) {
								artists[track.artists[i].name] = track.artists[i].name;
							}
						}
					
					});
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					// error handler here
				},
			});
		});

		document.getElementById("artists_btn").addEventListener("click", () => populateAndDisplayNode("artists", artists));
		document.getElementById("albums_btn").addEventListener("click", () => populateAndDisplayNode("albums", albums));
	}

	function retrieveTracks(timeRangeSlug, domNumber, domPeriod) {
		$.ajax({
			url: `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timeRangeSlug}`,
			headers: {
				Authorization: "Bearer " + access_token,
			},
			success: function (response) {
				var data = {
					trackList: response.items,
					total: 0,
					date: today.toLocaleDateString("en-US", dateOptions).toUpperCase(),
					json: true,
				};
				for (var i = 0; i < data.trackList.length; i++) {
					data.trackList[i].name = data.trackList[i].name.toUpperCase();
					data.total += data.trackList[i].duration_ms;
					let minutes = Math.floor(data.trackList[i].duration_ms / 60000);
					let seconds = (
						(data.trackList[i].duration_ms % 60000) /
						1000
					).toFixed(0);
					data.trackList[i].duration_ms =
						minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
					for (var j = 0; j < data.trackList[i].artists.length; j++) {
						data.trackList[i].artists[j].name = data.trackList[i].artists[
							j
						].name.trim();
						data.trackList[i].artists[j].name = data.trackList[i].artists[
							j
						].name.toUpperCase();
						if (j != data.trackList[i].artists.length - 1) {
							data.trackList[i].artists[j].name =
								data.trackList[i].artists[j].name + ", ";
						}
					}
				}
				minutes = Math.floor(data.total / 60000);
				seconds = ((data.total % 60000) / 1000).toFixed(0);
				data.total = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
				userProfilePlaceholder.innerHTML = userProfileTemplate({
					tracks: data.trackList,
					total: data.total,
					time: data.date,
					num: domNumber,
					name: displayName,
					period: domPeriod,
				});

				document
					.getElementById("download")
					.addEventListener("click", function () {
						var offScreen = document.querySelector(".receiptContainer");

						window.scrollTo(0, 0);
						// Use clone with htm2canvas and delete clone
						html2canvas(offScreen).then((canvas) => {
							var dataURL = canvas.toDataURL();
							console.log(dataURL);
							var link = document.createElement("a");
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
			},
		});
	}

	var params = getHashParams();

	var access_token = params.access_token,
		refresh_token = params.refresh_token,
		error = params.error;

	if (error) {
		alert("There was an error during the authentication");
	} else {
		if (access_token) {
			$.ajax({
				url: "https://api.spotify.com/v1/me",
				headers: {
					Authorization: "Bearer " + access_token,
				},
				success: function (response) {
					displayName = response.display_name.toUpperCase();
					$("#login").hide();
					$("#loggedin").show();
				},
			});
			loadInitialTracks();
		} else {
			// render initial screen
			$("#login").show();
			$("#loggedin").hide();
		}

		document.getElementById("short_term").addEventListener("click", () => retrieveTracks("short_term", 1, "LAST MONTH"), false);
		document.getElementById("medium_term").addEventListener("click", () => retrieveTracks("medium_term", 2, "LAST 6 MONTHS"), false);
		document.getElementById("long_term").addEventListener("click", () => retrieveTracks("long_term", 3, "ALL TIME"), false);
	}
})();
