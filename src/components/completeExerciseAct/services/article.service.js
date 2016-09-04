(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('articleSrv',function () {
            'ngInject';

            this.numberLines = function (content) {
                if (angular.isArray(content)) {
                    content = _arrayMarkups(content);
                }
                content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');

                var start = false;
                var htmlParagraphs = content.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                var j, i, ln = 0;
                var res = '';
                for (j = 0; j < htmlParagraphs.length; ++j) {
                    if (htmlParagraphs[j] === '') {
                        continue;
                    }

                    var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                    for (i = 0; i < htmlLines.length; ++i) {
                        if (htmlLines[i].match('_')) {
                            htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                            start = true;
                        }
                        if (!start) {
                            continue;
                        }
                        if (htmlLines[i].match('#')) {
                            htmlLines[i] = htmlLines[i].replace('#', '');
                            continue;
                        }
                        ln += 1;
                        if (ln === 1 || ln % 5 === 0) {
                            if (_stringEndsWith(htmlLines[i], '</p>')) {
                                var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                var lastTag = htmlLines[i].substr(lastTagIndex);
                                var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                            } else {
                                htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                            }
                        }
                        htmlLines[i] = htmlLines[i] + '<br>';
                    }
                    res = res + '<p>' + htmlLines.join('') + '</p>';
                }
                return res;
            };

            function _arrayMarkups(contentArr) {
                var markup = '';

                angular.forEach(contentArr, function (item) {
                    if (item.body) {
                        markup += item.body;
                    }
                });

                return markup;
            }

            function _stringEndsWith(str, searchString) {
                return str.indexOf(searchString, str.length - searchString.length) !== -1;
            }
        });
})(angular);
