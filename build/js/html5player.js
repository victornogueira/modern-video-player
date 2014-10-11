/*
   Modern Video Player - v1.0 - 8/31/2014
   http://www.victornogueira.com/html5player
   
   Some rights reserved (cc) 2014 Victor Nogueira
   http://creativecommons.org/licenses/by-sa/3.0/
-----------------------------------------------------------------------------------------------*/

(function() {

	jsPlayer = function ($media, options) {

		var	fullscreenIsEnabled = document.fullscreenEnabled ||
	                          document.mozFullScreenEnabled ||
			                  document.webkitFullscreenEnabled ||
			                  document.msFullscreenEnabled;

		if (fullscreenIsEnabled) {
			
			/* Options
			-----------------------------------------------------------------------------------*/

			// Default settings
			var settings = {
				defaultVolume : 1
			}

			// Copy properties of 'options' to 'defaults', overwriting existing ones.
			for (prop in options) {
		        if (options.hasOwnProperty(prop)) {
		            settings[prop] = options[prop];
		        }
		    }


		    /* Declaring vars
			-----------------------------------------------------------------------------------*/

			var $player, $controls, $playPause, $volume, $volumeTrack, $volumeSlider, $volumeIcon,
			    $timeTrack, $timeSlider, $timeLoadedBar, $timer, $fullScreen, videoWidth,
			    videoHeight, isFullScreen, wasPlaying, bufferingDetected, checkBufferInterval,
			    lastPlayPos, currentPlayPos, fullscreenIsEnabled, seeking, mouseMoveTimeout;


			/* Core Functions
			-----------------------------------------------------------------------------------*/

			// Creates player

			function createPlayer() {
				// Creates player div
				$player = document.createElement('div');

				// Replace media with wrapper
				$media.parentNode.replaceChild($player, $media);
				
				// Add player wrapper classes
				$player.classList.add('video-player');
				$player.classList.add('video-player--first-play');
				$player.classList.add('js-player');

				// Reapend media inside player wrapper
				$player.appendChild($media);

				// Create controls markup
				var playerControls =
				'<div class="video-player__controls js-player-controls">' +
					'<button class="video-player__play-pause ir bare-button js-player-play-pause">Play</button>' +
					'<div class="video-player__time-wrapper">' +
						'<div class="video-player__track video-player__time-track js-player-time-track">' +
							'<div class="video-player__loaded ir js-player-time-track-loaded" min="0" value="0"></div>' +
							'<button class="video-player__slider video-player__time-slider bare-button js-player-time-track-slider"></button>' +
						'</div>' +
						'<div class="video-player__timer js-player-timer">00:00</div>' +
					'</div>' +
					'<div class="video-player__volume js-player-volume">' +
						'<button class="video-player__volume-icon bare-button ir js-player-volume-icon">Mute</button>' +
						'<div class="video-player__track video-player__volume-track js-player-volume-track">' +
							'<button class="video-player__slider video-player__volume-slider bare-button js-player-volume-slider"></button>' +
						'</div>' +
					'</div>' +
					'<button class="video-player__fullscreen-icon ir bare-button js-fullscreen" href="#">Full Screen</button>' +
				'</div>';

				// Append controls markup
				$media.insertAdjacentHTML('afterend',playerControls);

				// Redefine core vars
				$controls           = $player.querySelector('.js-player-controls');
				$playPause          = $player.querySelector('.js-player-play-pause');
				$volume             = $player.querySelector('.js-player-volume');
				$volumeTrack        = $player.querySelector('.js-player-volume-track');
				$volumeSlider       = $player.querySelector('.js-player-volume-slider');
				$volumeIcon         = $player.querySelector('.js-player-volume-icon');
				$timeTrack          = $player.querySelector('.js-player-time-track');
				$timeSlider         = $player.querySelector('.js-player-time-track-slider');
				$timeLoadedBar      = $player.querySelector('.js-player-time-track-loaded');
				$timer              = $player.querySelector('.js-player-timer');
				$fullScreen         = $player.querySelector('.js-fullscreen');
				videoWidth          = $media.getAttribute('width');
				videoHeight         = $media.getAttribute('height');
				isFullScreen        = false;
				wasPlaying          = false;
				bufferingDetected   = false;
				checkBufferInterval = 500;
				lastPlayPos         = 0;
				currentPlayPos      = 0;
			}


			// Starts player

			function init() {
				// Creates player markup
				createPlayer();

				// Removes default controls
				$media.removeAttribute('controls');

				// Show custom controls
				if (videoWidth > 0) {
					$player.style.width = videoWidth + 'px';
				}
				$controls.style.visibility = 'visible';

				// Resets volume
				volumeReset();
			}

			
			// Play/Pause

			function play() {
				$media.play();
				$playPause.classList.add('video-player__play-pause--playing');
			}
			
			function pause() {
				$media.pause();
				$playPause.classList.remove('video-player__play-pause--playing');
			}
			
			function playPause() {
				if ($player.classList.contains('video-player--first-play')) {
					$player.classList.remove('video-player--first-play');
				}
			
				if ($media.paused) {
					play();
				} else {
					pause();
				}
			}


			// Track click

			function trackClick(track, slider) {
				var relativeX    = mouseX - track.getBoundingClientRect().left;
				var relativeXPct = relativeX / track.getBoundingClientRect().width * 100
				
				if (relativeXPct >= 100) {
					relativeXPct = 100;
				} else if (relativeX <= 0) {
					relativeXPct = 0;
				}
				
				slider.style.width = relativeXPct + '%';
			}


			// Time-track

			function getTimeTrackWidth() {			
				return $timeTrack.getBoundingClientRect().width;
			}

			function getTimeSliderWidth() {
				return $timeSlider.getBoundingClientRect().width;
			}
			
			function getCurrTime() {
				return Math.floor($media.currentTime);
			}
			
			function getTotalTime() {
				if ($media.readyState > 0) {
					return $media.duration;
				}
				return 0;
			}
			
			function calcCurrTime() {
				return Math.round(getTotalTime()/getTimeTrackWidth() * getTimeSliderWidth());
			}
			
			function calcTimeSliderWidth() {
				return getCurrTime()/getTotalTime() * 100;
			}

			function updateTimeTrack() {		
				if ($media.ended == false) {
					$timeSlider.style.width = calcTimeSliderWidth() + '%';
					
					$timer.innerHTML = formatTime(secondsToTime(getCurrTime()));
				} else {
					// If media has ended...
					pause();
					$timeSlider.style.width = 0;
					$timer.innerHTML = '00:00';
				}
			}

			function timeSeeking() {
				trackClick($timeTrack, $timeSlider);
				$media.currentTime = calcCurrTime();
			}


			// Buffer

			function getTimeBuffered() {
				if ($media.readyState > 0) {
					return $media.buffered.end(0);
				}
				return 0;
			}

			function getPctBuffered() {
				return getTimeBuffered() * 100 / getTotalTime();
			}
			
			function updateBufferTrack() {
				var timeLoadedBarWidth = getTimeBuffered()/getTotalTime() * 100;
						
				$timeSlider.style.width = getTimeSliderWidth();
				$timeLoadedBar.style.width = timeLoadedBarWidth + '%';

				// Updates HTML tag values
				$timeLoadedBar.innerHTML = Math.floor(getPctBuffered()) + '% carregados';
				$timeLoadedBar.setAttribute('value',Math.floor(getTimeBuffered()));
				$timeLoadedBar.setAttribute('max',Math.floor(getTotalTime()));
			}

			function checkBuffering() {
				currentPlayPos = $media.currentTime;
				// Checking time offset, e.g. 1 / 50ms = 0.02
				var offset = 1 / checkBufferInterval;

				// We should check if the user haven't paused the video...
				if (!$media.paused) {
					if (!bufferingDetected && currentPlayPos < lastPlayPos + offset) {
						bufferingDetected = true;

						$player.classList.remove('video-player--hide-controls');
						$timeTrack.classList.add('video-player__time-track--stalled');
						$player.classList.add('video-player--show-controls');
					}
					if (
						bufferingDetected && currentPlayPos > lastPlayPos + offset) {
						bufferingDetected = false;

						$timeTrack.classList.remove('video-player__time-track--stalled');
						$player.classList.remove('video-player--show-controls');
					}
				}
				
				lastPlayPos = currentPlayPos;
			}

			// Timer

			function secondsToTime(secs) {
				var hours = Math.floor(secs / (60 * 60));
				var divisor_for_minutes = secs % (60 * 60);
				var minutes = Math.floor(divisor_for_minutes / 60);
				var divisor_for_seconds = divisor_for_minutes % 60;
				var seconds = Math.ceil(divisor_for_seconds);
				
				var obj = {
					'hours': hours,
					'minutes': minutes,
					'seconds': seconds
				};
				return obj;
			}
			
			function padZeros(number) {
				return (number < 10 ? '0' : '') + number
			}
			
			function formatTime(time) {
				if(time.hours) {
					return padZeros(time.hours) + ':'+
						   padZeros(time.minutes) + ':' +
						   padZeros(time.seconds);
				}
				return padZeros(time.minutes) + ':' + padZeros(time.seconds);
			}


			// Volume

			function volumeReset() {		
				$volumeSlider.style.width = settings.defaultVolume * 100 + '%';
				updateVolume();
			}
			
			function mute() {
				if ($media.volume > 0) {	
					oldVolumeLevel = $media.volume;
					$volumeSlider.style.width = 0;
					updateVolume();
				} else {
					$volumeSlider.style.width = oldVolumeLevel * 100 + '%';
					updateVolume();
				}
			}
			
			function getVolumeSliderWidth() {
				return $volumeSlider.getBoundingClientRect().width;
			}
			
			function updateVolume() {
				var volumeLevelWidth = $volumeTrack.getBoundingClientRect().width;
				var calcVolumeLevel = getVolumeSliderWidth()/volumeLevelWidth;
				
				if (calcVolumeLevel == 0) {
					$volumeIcon.classList.add('video-player__volume-icon--mute');
				} else {
					$volumeIcon.classList.remove('video-player__volume-icon--mute');
				}	
				$media.volume = calcVolumeLevel;
			}


			// Full-screen

			function enterFullScreen() {
				if ($media.requestFullscreen) {
				  $player.requestFullscreen();
				} else if ($media.msRequestFullscreen) {
				  $player.msRequestFullscreen();
				} else if ($media.mozRequestFullScreen) {
				  $player.mozRequestFullScreen();
				} else if ($media.webkitRequestFullscreen) {
				  $player.webkitRequestFullScreen();
				}
			}

			function exitFullScreen() {
				if (document.exitFullscreen) {
				  document.exitFullscreen();
				} else if (document.msExitFullscreen) {
				  document.msExitFullscreen();
				} else if (document.mozCancelFullScreen) {
				  document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) {
				  document.webkitExitFullscreen();
				}
			}

			function toggleFullScreen() {
				if (isFullScreen) {
					exitFullScreen();
				} else {
					enterFullScreen();
				}
			}

			function fullScreenChange() {
				if (isFullScreen == true) {
					$fullScreen.classList.remove('video-player__fullscreen-icon--fullscreen');

					if (videoWidth > 0) {
						$player.style.width = videoWidth + 'px';
						$media.setAttribute('width',videoWidth);
					}

					if (videoHeight > 0) {
						$media.setAttribute('height',videoHeight);
					}

					isFullScreen = false;
				} else {
					$fullScreen.classList.add('video-player__fullscreen-icon--fullscreen');

					if (videoWidth > 0) {
						$player.style.width = '';
						$media.setAttribute('width','');
					}

					if (videoHeight > 0) {
						$media.setAttribute('height','');
					}

					isFullScreen = true;
				}
			}


			/* Init
			-----------------------------------------------------------------------------------*/

			init();


			/* Play / Pause
			-----------------------------------------------------------------------------------*/

			$playPause.addEventListener('click', function() {
				playPause();

				return false;
			});
			
			$media.addEventListener('click', function() {	
				playPause();

				return false;
			});

				
			/* Dragging for time and volume bars
			-----------------------------------------------------------------------------------*/
				
			window.addEventListener('mousemove',function(e) {
				mouseX = e.pageX;
				mouseY = e.pageY;
			});

				
			/* Volume
			-----------------------------------------------------------------------------------*/
			
			// Mute Button	
			$volumeIcon.addEventListener('click', function() {
				mute();
				
				return false;
			});
			
			// Dragging for volume bar
			$volumeTrack.addEventListener('mousedown', function(e) {
				if (e.which == 1) {
				   seeking = setInterval(function(){
						trackClick($volumeTrack, $volumeSlider);
						updateVolume();
					},50);
				}
				return false;
			});

			document.addEventListener('mouseup',function(){
				clearInterval(seeking);
			});
			
			
			/* Time
			-----------------------------------------------------------------------------------*/

			// Updates timer and buffer
			setInterval(function(){
				updateTimeTrack();
				updateBufferTrack();
			},1000);

			// Check if video is not playing because it's stopped buffering
			setInterval(checkBuffering, checkBufferInterval);

			// Dragging for time bar
			$timeTrack.addEventListener('mousedown',function(e) {	
				if (e.which == 1) {
					timeSeeking();
					
					seeking = setInterval(function(){
						timeSeeking();
					},50);

					if ($playPause.classList.contains('video-player__play-pause--playing')) {
						pause();
						wasPlaying = true;
					}

					// If track is clicked before first play, jump to point and play
					if ($player.classList.contains('video-player--first-play')) {
						playPause();
					}
				}
				return false;
			});

			document.addEventListener('mouseup',function(){
				clearInterval(seeking);
				
				if (wasPlaying) {
					play();
					wasPlaying = false;
				}
			});


			/* Full screen
			-----------------------------------------------------------------------------------*/

			$fullScreen.addEventListener('click',function(){
				toggleFullScreen();

				return false;
			});

			document.addEventListener("fullscreenchange", fullScreenChange);
			document.addEventListener("webkitfullscreenchange", fullScreenChange);
			document.addEventListener("mozfullscreenchange", fullScreenChange);
			document.addEventListener("MSFullscreenChange", fullScreenChange);


			/* If idle, hide controls
			-----------------------------------------------------------------------------------*/

			$player.addEventListener('mousemove', function() {
				if (!$player.classList.contains('video-player--first-play')) {
					if (mouseMoveTimeout !== null) {
						clearTimeout(mouseMoveTimeout);
						
						$player.classList.remove('video-player--hide-controls');
						$player.style.cursor = '';
					}

					mouseMoveTimeout = setTimeout(function() {
						mouseMoveTimeout = null;
						
						if (!$timeTrack.classList.contains('video-player__time-track--stalled')) {
							$player.classList.add('video-player--hide-controls');	

							if (isFullScreen) {
								$player.style.cursor = 'none';
							}
						}
						
					}, 3000);
				}
			});


			/* Prevent right click on video
			-----------------------------------------------------------------------------------*/

			$media.addEventListener('contextmenu', function(e) {
				e.preventDefault();
			}, false);
		}
	}
}());