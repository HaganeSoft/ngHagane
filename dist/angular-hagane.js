var ngHagane = angular.module('ngHagane', ['ngCookies', 'ngFileUpload']);
ngHagane.constant('MODULE_VERSION', '0.0.1');

ngHagane.provider('hagane', function () {
	settings = {};

	settings.host;
	settings.appToken;

	this.setHost = function (host) {
		settings.host = host;
	}

	this.setAppToken = function (appToken) {
		settings.appToken = appToken;
	}

	this.$get = ['$http', '$cookies', '$q', 'Upload', function ($http, $cookies, $q, Upload) {
		var session = {};
		session.user = {};

		var hagane = {};
		hagane.session = {};
		hagane.api = {};

		var token = $cookies.get('hgsession');
		if (token) {
			session.user.accessToken = token;
		}

		hagane.getHost = function () {
			return settings.host;
		}

		hagane.getAppToken = function () {
			return settings.appToken;
		}

		hagane.session.getRole = function () {
			if (session.user.role != null) {
				return session.user.role;
			} else {
				return false;
			}
		}
		
		hagane.session.getId = function() {
			if(session.user.id != null) {
				return session.user.id;
			} else {
				return false;
			}
		}

		hagane.session.create = function (accessToken, userId, userRole) {
			$cookies.put('hgsession', accessToken);
			session.user.accessToken = accessToken;
			session.user.id = userId;
			session.user.role = userRole;
		};

		hagane.session.destroy = function () {
			$cookies.put('hgsession', '');
			session.user = {};
		};

		hagane.session.authorize = function () {
			var defer = $q.defer();
			if (session.user.accessToken != null && session.user.accessToken != '') {
				$http
				.post(settings.host + '/User/authorize', session.user)
				.then(function (res) {
					if (res.data.success) {
						var user = res.data.message.user;
						hagane.session.create(session.user.accessToken, user.id, user.role);

						defer.resolve(res.data.message);
					} else if (res.data.error) {
						defer.reject(res.data.error);
					} else {
						console.log('authorize failed');
					}
				});
			} else {
				defer.reject('No accessToken');
			}
			return defer.promise;
		};

		hagane.session.identity = function () {
			var defer = $q.defer();
			defer.resolve(session.user);
			return defer.promise;
		};

		hagane.login = function (credentials) {
			var defer = $q.defer();

			return $http
			.post(settings.host + '/User/login', credentials)
			.then(function (res) {
				if (res.data.success) {
					var user = res.data.message.user;
					hagane.session.create(user.accessToken, user.id, user.role);

					defer.resolve(res.data.message);
				} else if (res.data.error) {
					defer.reject(res.data.error);
				} else {
					console.log('login failed');
				}
				return defer.promise;
			});
		}

		hagane.logout = function () {
			var defer = $q.defer();

			return $http
			.post(settings.host + '/User/logout', {accessToken: session.user.accessToken})
			.then(function (res) {
				if (res.data.success) {
					var user = res.data.message.user;
					hagane.session.destroy();

					defer.resolve(res.data.message);
				} else if (res.data.error) {
					defer.reject(res.data.error);
				} else {
					console.log('logout failed');
				}
				return defer.promise;
			});
		}

		hagane.api.get = function (path) {
			var defer = $q.defer();
			var config = {
				params: {
					accessToken: session.user.accessToken
				}
			};
			return $http
			.get(settings.host + path, config)
			.then(function (res) {
				if (res.data.success) {
					defer.resolve(res.data.message);
				} else if (res.data.error) {
					defer.reject(res.data.error);
				} else {
					console.log('hagane get failed');
				}
				return defer.promise;
			});
		};

		hagane.api.post = function (path, data) {
			var defer = $q.defer();

			if (data) {
				if (session.user.accessToken) {
					data.accessToken = session.user.accessToken;
				}
				return $http
				.post(settings.host + path, data)
				.then(function (res) {
					delete data.accessToken;
					if (res.data.success) {
						defer.resolve(res.data.message);
					} else if (res.data.error) {
						defer.reject(res.data.error);
					} else {
						console.log('hagane post failed');
					}
					return defer.promise;
				});
			} else {
				console.log('hagane post no data');
			}
		};

		hagane.api.postFile = function (path, file, data, postData) {
			if (file) {
				var defer = $q.defer();

				if (session.user.accessToken) {
					data.accessToken = session.user.accessToken;
				}
				return Upload.upload({
					url: settings.host + path,
					method: 'POST',
					// file: file,
					data: {file: file, jsonData: Upload.json(data), postData: postData}
					// sendFieldsAs: 'form'
				})
				.then(function (res) {
					delete data.accessToken;
					if (res.data.success) {
						defer.resolve(res.data.message);
					} else if (res.data.error) {
						defer.reject(res.data.error);
					} else {
						console.log('hagane file post failed');
					}
					return defer.promise;
				});
			} else {
				// console.log('hagane file post no data');
				return hagane.api.post(path, data);
			}
		};

		hagane.api.put = function (path, data) {
			var defer = $q.defer();

			if (data) {
				if (session.user.accessToken) {
					data.accessToken = session.user.accessToken;
				}
				return $http
				.put(settings.host + path, data)
				.then(function (res) {
					if (res.data.success) {
						defer.resolve(res.data.message);
					} else if (res.data.error) {
						defer.reject(res.data.error);
					} else {
						console.log('hagane post failed');
					}
					return defer.promise;
				});
			} else {
				console.log('hagane put no data');
			}
		};

		hagane.api.delete = function (path) {
			var defer = $q.defer();
			var config = {
				params: {
					accessToken: session.user.accessToken
				}
			};
			return $http
			.delete(settings.host + path, config)
			.then(function (res) {
				if (res.data.success) {
					defer.resolve(res.data.message);
				} else if (res.data.error) {
					defer.reject(res.data.error);
				} else {
					console.log('hagane post failed');
				}
				return defer.promise;
			});
		};


		hagane.session.isAuth = function () {
			return !!session.userId;
		};

		return hagane;
	}];
});
ngHagane.constant('HG_AUTH_EVENTS', {
	LOGIN_SUCCESS: 'auth-login-success',
	LOGIN_FAILED: 'auth-login-failed',
	LOGOUT_FAILED: 'auth-logout-failed',
	LOGOUT_SUCCESS: 'auth-logout-success',
	SESSION_TIMEOUT: 'auth-session-timeout',
	IS_AUTHORIZED: 'is-authorized',
	NOT_AUTHENTICATED: 'auth-not-authenticated',
	NOT_AUTHORIZED: 'auth-not-authorized'
});
