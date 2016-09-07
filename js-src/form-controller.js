/**
 * Created by Tim Osadchiy on 28/08/2016.
 */

'use strict';

var Blob = require('blob'),
    yaml = require('js-yaml'),
    saveAs = require('browser-filesaver').saveAs;

var SOURCE_TYPES = ['Image', 'YouTube'],
    DATE_FORMAT = 'MMMM d, yyyy';

module.exports = function (app) {
    app.controller('FormController', ['$scope', '$filter', '$timeout', controllerFn]);
};

function controllerFn($scope, $filter, $timeout) {

    $scope.sourceTypes = SOURCE_TYPES;
    $scope.dateFormat = DATE_FORMAT;

    $scope.welcomeState = false;
    $scope.contextSources = [new ContextSourceModel()];
    $scope.links = [new LinkModel()];
    $scope.backStory = {
        text: '',
        author: '',
        magazine: '',
        date: '',
        url: ''
    };
    $scope.creativeCommons = {
        ccOwnerName: '',
        ccYear: '',
        codeOfEthics: '',
        description: ''
    };

    $scope.toggleWelcomeState = function() {
        $scope.welcomeState = !$scope.welcomeState;
    };
    $scope.addContext = function () {
        $scope.contextSources.push(new ContextSourceModel());
    };
    $scope.removeContext = function (item) {
        var i = $scope.contextSources.indexOf(item);
        $scope.contextSources.splice(i, 1);
    };
    $scope.addLink = function () {
        $scope.links.push(new LinkModel());
    };
    $scope.removeLink = function (item) {
        var i = $scope.links.indexOf(item);
        $scope.links.splice(i, 1);
    };
    $scope.generate = function () {
        var j = scopeToJSON.call($scope, $filter),
            y = yaml.safeDump(j),
            b = new Blob([y], {type: "text/plain;charset=utf-8"});
        saveAs(b, "4c.yaml");
    };

    $scope.loadDataFromReader = function (data) {
        loadDataToController.call($scope, data);
    };
}

function ContextSourceModel(obj) {
    obj = obj || {};
    this.sourceType = obj.sourceType ? obj.sourceType : SOURCE_TYPES[0];
    this.source = obj.source ? obj.source : '';
    this.credit = obj.credit ? obj.credit : '';
    this.getPlaceholder = function () {
        if (this.sourceType == SOURCE_TYPES[0]) {
            return 'images/example.jpg or http://example.com/images/example.png';
        } else if (this.sourceType == SOURCE_TYPES[1]) {
            return '123456';
        }
    };
    this.toJSON = function () {
        var obj = {credit: this.credit};
        if (this.sourceType == SOURCE_TYPES[0]) {
            obj.src = this.source;
        } else if (this.sourceType == SOURCE_TYPES[1]) {
            obj.youtube_id = this.source;
        }
        return obj;
    };
}

function LinkModel(obj) {
    obj = obj || {};
    this.title = obj.title ? obj.title : '';
    this.url = obj.url ? obj.url : '';
    this.toJSON = function () {
        return {
            title: this.title,
            url: this.url
        }
    };
}

function scopeToJSON($filter) {
    var obj = {};
    obj.context = [];
    for (var i = 0, l = this.contextSources.length; i < l; i++) {
        obj.context.push(this.contextSources[i].toJSON());
    }
    obj.links = [];
    for (var i = 0, l = this.links.length; i < l; i++) {
        obj.links.push(this.links[i].toJSON());
    }
    obj.backStory = {
        text: this.backStory.text,
        author: this.backStory.author,
        magazine: this.backStory.magazine,
        magazineUrl: this.backStory.url,
        date: $filter('date')(this.backStory.date, this.backStory.dateFormat)
    };
    obj.creativeCommons = {
        copyright: this.creativeCommons.ccOwnerName + ' © ' + this.creativeCommons.ccYear,
        codeOfEthics: this.creativeCommons.codeOfEthics,
        description: this.creativeCommons.description
    };
    return obj;
}

function loadDataToController(data) {
    this.contextSources = data.context.map(function (c) {
        return new ContextSourceModel({
            sourceType: c.src ? SOURCE_TYPES[0] : SOURCE_TYPES[1],
            source: c.src || c.youtube_id,
            credit: c.credit
        });
    });

    this.links = data.links.map(function (l) {
        return new LinkModel({
            title: l.title,
            url: l.url
        });
    });

    this.backStory = {
        text: data.backStory.text,
        author: data.backStory.author,
        magazine: data.backStory.magazine,
        date: data.backStory.date,
        url: data.backStory.magazineUrl
    };

    var copyright = data.creativeCommons.copyright.split(' © ');
    this.creativeCommons = {
        ccOwnerName: copyright[0],
        ccYear: copyright[1],
        codeOfEthics: data.creativeCommons.codeOfEthics,
        description: data.creativeCommons.description
    };
    this.welcomeState = false;
    this.$apply();
}