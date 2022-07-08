(() => {
    var requestAnimationFrame = window.requestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || 
                                window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

    class GameRecorder {
        constructor() {
            this._reset();
            
            setTimeout(this._composeVideo, 2000)
        }

        get result() {
            return this._result;
        }

        start() {
            console.log('GameRecorder.start');
            if (this._isRecording) {
                this._pause = false;
                this._recorder.resume();
                return;
            }

            this._reset();
            const stream = this._createStream();

            const MIMETYPE_LIST = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264',
                'video/webm',
                'video/mpeg'
            ];
            this._recorder = new MediaRecorder(stream);
            this._mimeType = this._recorder.mimeType;
            this._recorder.addEventListener('dataavailable', (e) => {
                this._chunks.push(e.data);
            });
            this._recorder.start(5000);
            this._isRecording = true;
        }

        pause() {
            console.log('GameRecorder.pause');
            this._pause = true;
            this._recorder.pause();
        }

        stop() {
            console.log('GameRecorder.stop');
            if (!this._isRecording) return Promise.reject();

            return new Promise((resolve) => {
                this._isRecording = false;
                this._recorder.addEventListener('stop', (e) => {
                    console.log(this._chunks);
                    this._result = new Blob(this._chunks, {
                        type: this._mimeType
                    });
                    console.log(this._chunks);
                    resolve(this._result);
                });
                this._recorder.stop();
            });
        }

        _reset() {
            console.log('GameRecorder._reset');
            this._chunks = [];
            this._isRecording = false;
            this._pause = false;
            this._result = null;
        }

        _createStream() {
            console.log('GameRecorder._createStream');
            // const audioContext =  window.WebAudio._context;
            // const audioNode = window.WebAudio._masterGainNode;
            // const destination = audioContext.createMediaStreamDestination();
            // audioNode.connect(destination);
            // const oscillator = audioContext.createOscillator();
            // oscillator.connect(destination);

            // const audioStream = destination.stream;

            const audioStream = document.querySelector('audio').captureStream();
            console.log(audioStream);
            const canvasStream = document.getElementById('my-canvas').captureStream();
            console.log(canvasStream);

            const mediaStream = new MediaStream();
            [canvasStream, audioStream].forEach((stream) => {
                stream.getTracks().forEach((track) => mediaStream.addTrack(track));
            });
            console.log(mediaStream);

            return mediaStream;
        }
        
        _composeVideo() {
            let arCanvas = document.querySelector('.a-canvas');
            const video = document.getElementById('arjs-video');

            let canvas = document.getElementById('my-canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'my-canvas';
                canvas.height = arCanvas.height;
                canvas.width = arCanvas.width;
                canvas.style.width = '320px';
                canvas.style.height = '240px';
                // canvas.style.display = 'none';
                document.getElementById('record-preview').appendChild(canvas);
            }
            let arImage = document.getElementById('my-img');
            if (!arImage) {
                arImage = document.createElement('img');
                arImage.id = 'my-img';
                arImage.height = arCanvas.height;
                arImage.width = arCanvas.width;
                arImage.style.width = '320px';
                arImage.style.height = '240px';
                // document.getElementById('record-preview').appendChild(arImage);
            }

            const ctx = canvas.getContext('2d');

            frame();

            function frame() {
                arImage.src = arCanvas.toDataURL('image/png');

                arImage.addEventListener('load', function () {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.drawImage(arImage, 0, 0, canvas.width, canvas.height);
                }, false);
                window.requestAnimationFrame(frame);
            }
        }
    }

    // ゲーム内から使うのでシングルトンにする
    window.gameRecorder = new GameRecorder();

    // デモ用
    window.gameRecorder.showVideo = function () {
        console.log('window.gameRecorder.showVideo');
        let video = document.getElementById('my-video');
        if (!video) {
            video = document.createElement('video');
            video.id = 'my-video';
            video.setAttribute('controls', 'controls');
            video.style.width = '320px';
            video.style.height = '240px';
            video.style.pointerEvents = 'auto';
            document.getElementById('record-preview').appendChild(video);
        }
        console.log(window.gameRecorder.result);
        video.src = window.URL.createObjectURL(window.gameRecorder.result);
        video.play();
    };
    window.gameRecorder.downloadVideo = function () {
        console.log('window.gameRecorder.downloadVideo');
        let aTag = document.createElement('a');
        aTag.href = window.URL.createObjectURL(window.gameRecorder.result);
        aTag.download = 'a.mp4';
        aTag.click();
    };

    window.onload = () => {
        document.getElementById('record-start').addEventListener('click', (e) => {
            console.log('record-start');
            document.querySelector('audio').play();
            window.gameRecorder.start();
        });
        document.getElementById('record-stop').addEventListener('click', (e) => {
            console.log('record-stop');
            document.querySelector('audio').pause();
            document.querySelector('audio').currentTime = 0;
            window.gameRecorder.stop().then(() => {
                window.gameRecorder.showVideo();
            });
        });
        document.getElementById('record-dl').addEventListener('click', (e) => {
            console.log('record-dl');
            window.gameRecorder.downloadVideo();
        });
    }
})();