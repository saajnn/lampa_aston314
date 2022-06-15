(function () {
    'use strict';

    function collection(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            step: 250
        });
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        //var cors = object.source == 'rezka' ? 'https://cors.eu.org/' : 'http://corsanywhere.herokuapp.com/';
        var cors = '';
        var info;
        var last;
        var waitload = false;
        var relises = [];
        var total_pages;
        this.create = function () {
            var _this = this;
            // console.log(object.page);
            // console.log(object.cards);
            if ((object.page == 1) || object.cards || (!object.card && !Lampa.Storage.field('light_version') && object.card_cat)) {
                this.activity.loader(true);
                network.silent(cors + object.url, function (str) {
                    var data = _this.card(str);
                    _this.build(data);
                }, function (a, c) {
                    Lampa.Noty.show(network.errorDecode(a, c));
                }, false, {
                    dataType: 'text'
                });
            } else _this.build(object.data);
            return this.render();
        };
        this.next = function (page) {
            var _this2 = this;
            if (total_pages == 0) waitload = true;
            if (waitload) return;
            waitload = true;
            object.page++;
            //console.log(object.page);
            network.clear();
            network.timeout(1000 * 40);
            if (typeof page == 'undefined') return;
            //console.log(page);
            //var page1 = page.match(new RegExp('-([0-9])\.', ''))[0];
            //console.log(page1[0]);
            //page = page.replace(page.match(/-(\d+)/)[0],'-'+ object.page)
            //console.log(page.match(/[0-9]+(?=[^0-9]*$)(.+)/))
            page = page.replace(page.match(/[0-9]+(?=[^0-9]*$)(.+)/)[0],'') + object.page + page.match(/[0-9]+(?=[^0-9]*$)(.+)/)[1];
            network.silent(cors + page, function (result) {
                var data = _this2.card(result);
                object.data = data;
                _this2.append(data);
                if (data.card.length) waitload = false;
                Lampa.Controller.toggle('content');
                _this2.activity.loader(false);
            }, function (a, c) {
                Lampa.Noty.show(network.errorDecode(a, c));
            }, false, {
                dataType: 'text'
            });
        };
        this.append = function (data) {
            var _this2 = this;
            data.card.forEach(function (element) {
                var card = Lampa.Template.get('card', {
                    title: element.title,
                    release_year: object.cards || !object.card_cat ? element.year : element.quantity
                });
                //card.addClass(object.source == 'filmix' || !object.card_cat || object.cards ? 'card--category' : 'card--collection');
                card.addClass('card--category');
                if (object.card) {
                    card.find('.card__age').text('');
                }
                var img = card.find('.card__img')[0];
                img.onload = function () {
                    card.addClass('card--loaded');
                };
                img.onerror = function (e) {
                    img.src = './img/img_broken.svg';
                };
                //var picture = Lampa.Storage.field('proxy_other') === false ? element.img : Lampa.Utils.protocol() + 'proxy.cub.watch/img/' + element.img;
                var picture = element.img;
                img.src = picture;
                // card.find('.card__view').append('<div class="card__quality"></div>');
                // card.find('.card__quality').text(element.update);
                if (element.score){
                    card.find('.card__view').append('<div class="card__type"></div>');
                    card.find('.card__type').text(element.score);
                };
                card.on('hover:focus', function () {
                    last = card[0];
                    scroll.update(card, true);
                    if (!Lampa.Storage.field('light_version')) {
                        var maxrow = Math.ceil(items.length / 7) - 1;
                        if (Math.ceil(items.indexOf(card) / 7) >= maxrow) _this2.next(data.page);
                    }
                });
                card.on('hover:enter', function (target, card_data) {
                        Lampa.Modal.open({
                            title: '',
                            html: Lampa.Template.get('modal_loading'),
                            size: 'small',
                            mask: true,
                            onBack: function onBack() {
                            Modal.close();
                            Api.clear();
                            Controller.toggle('content');
                            }
                        });
                        Lampa.Api.search({
                            query: encodeURIComponent(element.title.replace(/( 第.+?季)/,''))
                        }, function (find) {
                            Lampa.Modal.close();
                            var finded = _this2.finds(find, element);
                            if (finded) {
                                Lampa.Activity.push({
                                    url: '',
                                    component: 'full',
                                    id: finded.id,
                                    method: finded.name ? 'tv' : 'movie',
                                    card: finded
                                });
                            } else {
                                Lampa.Noty.show('找不到影片信息。');
                                Lampa.Controller.toggle('content');
                            }
                        }, function () {
                            Lampa.Modal.close();
                            Lampa.Noty.show('找不到影片信息。');
                            Lampa.Controller.toggle('content');
                        });
                    
                });
                body.append(card);
                items.push(card);
            });
        };
        this.build = function (data) {
            if (data.card.length) {
                scroll.minus();
                html.append(scroll.render());
                this.append(data);
                if (Lampa.Storage.field('light_version')) this.more(data);
                scroll.append(body);
                this.activity.loader(false);
                this.activity.toggle();
            } else {
                html.append(scroll.render());
                this.empty();
            }
        };
        this.empty = function () {
            var empty = new Lampa.Empty();
            scroll.append(empty.render());
            this.start = empty.start;
            this.activity.loader(false);
            this.activity.toggle();
        };
        this.more = function (data) {
            var _this = this;
            var more = $('<div class="category-full__more selector"><span>显示更多</span></div>');
            more.on(!Lampa.Platform.get() ? 'hover:enter' : 'hover:focus', function (e) {
                Lampa.Controller.collectionFocus(last || false, scroll.render());
                var next = Lampa.Arrays.clone(object);
                if (data.total_pages == 0) {
                    more.remove();
                    return;
                }
                network.clear();
                network.timeout(1000 * 20);
                network.silent(cors + data.page, function (result) {
                    var card = _this.card(result);
                    next.data = card;
                    if (object.cards) next.cards = false;
                    delete next.activity;
                    next.page++;
                    if (card.card.length == 0) more.remove();
                    else Lampa.Activity.push(next);
                }, function (a, c) {
                    Lampa.Noty.show(network.errorDecode(a, c));
                }, false, {
                    dataType: 'text'
                });
            });
            body.append(more);
        };  
        this.card = function (str) {
            var card = [];
            var page;
            str = str.replace(/\n/g, '');
                var h =  $('.stui-vodlist__box', str);
                total_pages = $('.hidden-xs', str).find('a:last-child').length;
                var host = object.url.indexOf('http') == -1 ? '' : object.url.match(/(http|https):\/\/(www.)?(\w+(\.)?)+/)[0];
                page = host+$('.hidden-xs', str).find('a:last-child').attr('href');
                $(h).each(function (i, html) {
                    card.push({
                        title: $('a.stui-vodlist__thumb', html).attr('title'),
                        title_org: $('a.stui-vodlist__thumb', html).attr('title'),
                        url: $('a.stui-vodlist__thumb', html).attr('href'),
                        img: $('a.stui-vodlist__thumb', html).attr('data-original'),
                        quantity: ' ',
                        year: $('span.pic-text', html).text(),
                        update: $('span.pic-text', html).text(),
                        score: $('span.pic-tag', html).text()
                    });
                });           
            return {
                card: card,
                page: page,
                total_pages: total_pages
            };
        };
        this.finds = function(find) {
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var finded;
    
            var filtred = function filtred(items) {
              for (var i = 0; i < items.length; i++) {
                var item = items[i];
    
                if (params.original_title == item.original_title || params.title == item.title || params.original_title == item.name) {
                  finded = item;
                  break;
                }
              }
            };
    
            if (find.movie && find.movie.results.length) filtred(find.movie.results);
            if (find.tv && find.tv.results.length && !finded) filtred(find.tv.results);
            return finded;
        }
        this.finds1 = function (element, find) {
            var finded;
            var filtred = function filtred(items) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if ((element.title_org == (item.original_title || item.original_name) || element.title == (item.title || item.name)) && parseInt(element.year) == (item.first_air_date || item.release_date).split('-').shift()) {
                        finded = item;
                        break;
                    }
                }
            };
            if (find.movie && find.movie.results.length) filtred(find.movie.results);
            if (find.tv && find.tv.results.length && !finded) filtred(find.tv.results);
            return finded;
        };
        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function toggle() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                left: function left() {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function right() {
                    Navigator.move('right');
                },
                up: function up() {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function down() {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function back() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return html;
        };
        this.destroy = function () {
            network.clear();
            Lampa.Arrays.destroy(items);
            scroll.destroy();
            html.remove();
            body.remove();
            network = null;
            items = null;
            html = null;
            body = null;
            info = null;
        };
    }

    function startWEB() {
      window.plugin_web_ready = true;
      Lampa.Component.add('sisi', collection);
      var catalogs = [{
        title: '电影',
        url: 'https://www.libvio.me/type/1.html'
      }, {
        title: '剧集',
        url: 'https://www.libvio.me/type/2.html'
      }, {
        title: '日韩剧',
        url: 'https://www.libvio.me/type/15.html'
      },{
        title: '国产剧',
        url: 'https://www.libvio.me/type/13.html'
      }, {
        title: '欧美剧',
        url: 'https://www.libvio.me/type/16.html'
      }, {
        title: '港台剧',
        url: 'https://www.libvio.me/type/14.html'
      }, {
        title: '动漫',
        url: 'https://www.libvio.me/type/4.html'
      }];
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
          var ico = '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 20h8v2h-8C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a9.956 9.956 0 0 1-2 6h-2.708A8 8 0 1 0 12 20zm0-10a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-4 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-4 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="white"/></svg>';
          var menu_item = $('<li class="menu__item selector focus" data-action="doweb"><div class="menu__ico">' + ico + '</div><div class="menu__text">LIBVIO</div></li>');
          menu_item.on('hover:enter', function () {
            Lampa.Select.show({
              title: 'libvio.me',
              items: catalogs,
              onSelect: function onSelect(a) {
                Lampa.Activity.push({
                  url: a.url,
                  title: a.title,
                  component: 'sisi',
                  page: 1
                });
              },
              onBack: function onBack() {
                Lampa.Controller.toggle('menu');
              }
            });
          });
          $('.menu .menu__list').eq(0).append(menu_item);
        }
      });
    }

    if (!window.plugin_web_ready) startWEB();

})();
