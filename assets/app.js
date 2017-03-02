'use strict'

window.onload = function (exports) {

    new Clipboard('.copy')

    var mouseDown = 0

    document.onmousedown = function() {
      mouseDown++
    }
    document.onmouseup = function() {
      mouseDown--
    }

    function format(n) {
        n = n.toString(16)

        if (n.length < 2)
            n = '0' + n

        return '0x' + n
    }

    function fill(w, h) {
        var res = []

        for (var x = 0; x < w; x++) {
            var col = []

            for (var y = 0; y < h; y++)
                col[ y ] = false

            res.push(col)
        }

        return res
    }

    Vue.component('item', {
        template: '#item',
        props: [ 'x', 'y', 'active' ],
        data: function () {
            return {
                changed: false
            }
        },
        methods: {
            toggle: function () {
                var v = app.icon[ this.x ][ this.y ]
                Vue.set(app.icon[ this.x ], this.y, !v)
            },

            onMove: function () {
                if (!mouseDown || this.changed)
                    return

                this.toggle()
                this.changed = true
            },

            onMouseOut: function() {
                this.changed = false
            }
        }
    })

    var saveTimeout

    var app = exports.app = new Vue({
        el: '#app',
        data: {
            cols: 64,
            rows: 32,
            icon: fill(64, 32),
            editing: false,
            editedSource: ''
        },
        watch: {
            cols: function () {
                this.resize()
            },
            rows: function () {
                this.resize()
            },
            icon: function () {
                clearTimeout(saveTimeout)
                saveTimeout = setTimeout(this.save, 1000)
            },
            editing: function (value) {
                if (value)
                    this.editedSource = this.cppSource
                else
                    this.cppSource = this.editedSource
            }
        },
        computed: {
            bytes: {
                get: function () {
                    var bytes = [],
                        byte  = 0,
                        ic    = this.cols * this.rows / 8,
                        cy    = 0,
                        x     = 0,
                        i     = 0

                    for (; i < ic; i++, x++) {
                        if (x === this.cols) {
                            x = 0
                            cy += 8
                        }

                        var col = this.icon[ x ]

                        for (var y = cy, n = 0, b = 0; n < 8; y++, n++) {
                            if (col[ y ])
                                b += Math.pow(2, n)
                        }

                        bytes.push(b)
                    }

                    return bytes
                },
                set: function (bytes) {
                    var l = bytes.length,
                        cy = 0,
                        x = 0,
                        i = 0

                    for (; i < l; i++, x++) {
                        if (x === this.cols) {
                            x = 0
                            cy += 8
                        }

                        var b = bytes[ i ]

                        for (var y = cy, n = 0; n < 8; y++, n++)
                            Vue.set(this.icon[ x ], y, b & Math.pow(2, n))
                    }
                }
            },
            cppSource: {
                get: function () {
                    var src = 'const uint8_t bitmap[ ' + this.cols + ' * ' + this.rows + ' / 8 ] = {'

                    for (var i = 0, l = this.bytes.length; i < l; i++) {
                        if (i % 16 === 0)
                            src += '\n    '

                        src += format(this.bytes[ i ])

                        if (i < l - 1)
                            src += ', '
                    }

                    return src += '\n};'
                },
                set: function (source) {
                    var start = source.indexOf('{'),
                        end   = source.indexOf('}')

                    if (~start)
                        start += 1
                    else
                        start = 0

                    if (!~end)
                        end = source.length

                    try {
                        var bytes = source
                            .substring(start, end)
                            .trim()
                            .split(/\s*,\s*\n?/g)
                            .filter(Boolean)
                            .map(Number)
                    }
                    finally {
                        if (Array.isArray(bytes) && bytes.length && !bytes.some(isNaN))
                            this.bytes = bytes
                        else
                            alert('Unable to recognize bitmap from source code.')
                    }
                }
            }
        },
        methods: {
            resize: function () {
                this.icon = fill(this.cols, this.rows)
            },
            reset: function () {
                this.resize()
            },
            toJSON: function () {
                return JSON.stringify(this.icon)
            },
            load: function (json) {
                try {
                    var icon = JSON.parse(json)

                    if (!Array.isArray(icon))
                        throw new Error
                    else {
                        var height = -1

                        icon.forEach(function (col) {
                            if (!Array.isArray(col))
                                throw new Error

                            if (!~height)
                                height = col.length
                            else if (height !== col.length)
                                throw new Error
                        })

                        app.icon = icon
                    }
                }
                catch (ex) {
                    alert('Unable to open the selected file.')
                }
            },
            dump: function () {
                var name = prompt('File name:', 'bitmap.json')

                if (!name)
                    return

                /**
                 * @see http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
                 */
                var str  = this.toJSON(),
                    utf8 = unescape(encodeURIComponent(str)),
                    data = []

                for (var i = 0; i < utf8.length; i++)
                    data.push(utf8.charCodeAt(i))

                initiateFileDownload(new Uint8Array(data), name)
            },
            open: function (file) {
                var reader = new FileReader,
                    self   = this

                reader.onload = function(e) {
                    self.load(e.target.result)
                }

                reader.readAsText(file)
            },
            save: function () {
                localStorage.setItem('bitmap', this.toJSON())
            }
        }
    })

    // load previously edited image by default
    var previous = localStorage.getItem('bitmap')

    if (previous)
        app.load(previous)
    else if (!localStorage.getItem('defaultShown')) {
        localStorage.setItem('defaultShown', 1)
        app.load(DEFAULT_BITMAP)
    }

}.bind(window, window)
