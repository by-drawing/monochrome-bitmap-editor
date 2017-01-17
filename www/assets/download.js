/**
 * @see http://stackoverflow.com/questions/25445351/how-can-i-initiate-a-file-download-of-client-side-data-and-specify-its-file-name
 */

'use strict'

!function (exports) {

    function byteArrayToBase64(bytes) {
        var chArray = Array.prototype.map.call(bytes, function (byte) {
            return String.fromCharCode(byte)
        })

        return window.btoa(chArray.join(''))
    }

    var octetStreamMimeType = 'application/octet-stream'

    function tryAnchorDownload(fileBytes, fileName) {
        var aElement = document.createElement('a'),
            event;

        if ('download' in aElement) {
            aElement.setAttribute('download', fileName)
            aElement.href = 'data:' + octetStreamMimeType +
                            ';base64,' + byteArrayToBase64(fileBytes)

            document.body.appendChild(aElement)
            event = document.createEvent('MouseEvents')
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0,
                                 false, false, false, false, 0, null)
            aElement.dispatchEvent(event)
            document.body.removeChild(aElement)

            return true
        }

        return false
    }

    function trySaveAsDownload(fileBytes, fileName) {
        var blob;

        if (window.saveAs) {
            blob = new Blob([ fileBytes ], {
                type: octetStreamMimeType
            })

            saveAs(blob, fileName)

            return true
        }

        return false
    }

    // fileBytes is a Uint8Array
    function initiateFileDownload(fileBytes, fileName) {
        return tryAnchorDownload(fileBytes, fileName) ||
               trySaveAsDownload(fileBytes, fileName)
    }

    exports.initiateFileDownload = initiateFileDownload

}(window)
