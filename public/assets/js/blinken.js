(function() {
  "use strict";
  window.blinken = window.blinken || {};

  var Blinken = function($container) {
    this.$container = $container;
    this.config = this.getConfig();
    this.status = {};
    this.stats = {};
    this.getStatuses();
  };

  Blinken.prototype.getConfig = function() {
    var chromeExtensionConfig = window.chrome &&
      window.chrome.extension &&
      window.chrome.extension.getBackgroundPage() &&
      window.chrome.extension.getBackgroundPage().blinken_config;

    if (chromeExtensionConfig) {
      window.blinken_config = chromeExtensionConfig;
    }

    // Looks for the global variable `blinken_config` which is defined in config.js
    if (typeof window.blinken_config === "undefined") {
      throw new Error("Cannot find blinken_config global variable (have you included config.js in blinken.html?)");
    }
    return window.blinken_config;
  };

  Blinken.prototype.getStatuses = function() {
    var self = this;
    this.config.groups.forEach(function(group) {
      self.stats[group.id] = self.stats[group.id] || {};
      self.stats[group.id].number_of_environments = 0;
      self.stats[group.id].order_of_environments = [];
      self.$container.append('<div class="row blinken-group" id="' + group.id + '">');
      if (group.name) {
        self.$container.append('<h1>' + group.name + '</h1></div>');
      }
      group.environments.forEach(function(environment) {
        self.stats[group.id].number_of_environments++;
        self.stats[group.id].order_of_environments.push(environment.name);
        self.getStatus(group.id, environment.name, environment.url);
      });
    });
  };

  Blinken.prototype.getStatus = function(group_id, environment_name, environment_url) {
    var self = this;
    $.ajax({
      dataType: "json",
      url: environment_url + "/cgi-bin/icinga/status.cgi?servicestatustypes=28&jsonoutput=1",
      timeout: 5000,
      success: function(data) {
        if (!data.status) {
          // request was successfully made but Icinga is down
          self.setStatus(group_id, environment_name, environment_url, "?", "?", "?", "?");
        } else {
          var active_service_status = data.status.service_status.filter(function(service_status) {
            return service_status.has_been_acknowledged === false && service_status.in_scheduled_downtime === false;
          });
          var critical_entries = active_service_status.filter(function(service_status) {
            return service_status.status === "CRITICAL";
          }).length;
          var warning_entries = active_service_status.filter(function(service_status) {
            return service_status.status === "WARNING";
          }).length;
          var unknown_entries = active_service_status.filter(function(service_status) {
            return service_status.status === "UNKNOWN";
          }).length;
          var acknowledged_entries = data.status.service_status.filter(function(service_status) {
            return service_status.has_been_acknowledged === true;
          }).length;
          self.setStatus(group_id, environment_name, environment_url, critical_entries, warning_entries, unknown_entries, acknowledged_entries);
        }
      },
      error: function() {
        self.setStatus(group_id, environment_name, environment_url, "?", "?", "?", "?");
      }
    });
  };

  Blinken.prototype.setStatus = function(group_id, environment_name, environment_url, critical_entries, warning_entries, unknown_entries, acknowledged_entries) {
    this.status[group_id] = this.status[group_id] || {};
    this.status[group_id][environment_name] = {
      "environment_name": environment_name,
      "environment_url": environment_url,
      "timestamp": (new Date()).toLocaleString("en-GB", { "hour12": false }),
      "critical_entries": critical_entries,
      "warning_entries": warning_entries,
      "unknown_entries": unknown_entries,
      "acknowledged_entries": acknowledged_entries,
    };
    var environment_count = this.stats[group_id].number_of_environments;
    var environment_status_count = Object.keys(this.status[group_id]).length;
    if (environment_count === environment_status_count) {
      this.displayStatuses(group_id);
    }
  };

  Blinken.prototype.displayStatuses = function(group_id) {
    var self = this;
    this.stats[group_id].order_of_environments.forEach(function(environment_name) {
      var environment = self.status[group_id][environment_name];
      if (environment !== undefined) {
        var environment_style_class = self.getEnvironmentStyleClass(environment.critical_entries, environment.warning_entries, environment.unknown_entries, environment.acknowledged_entries);
        var critical_entries = self.getEntryHTML("critical", "Criticals", environment.critical_entries);
        var warning_entries = self.getEntryHTML("warning", "Warnings", environment.warning_entries);
        var unknown_entries = self.getEntryHTML("unknown", "Unknowns", environment.unknown_entries);
        var acknowledged_entries = self.getEntryHTML("acknowledged", "Acked", environment.acknowledged_entries);

        var environment_block = '<div class="col-md-3">' +
                                '<a href="' + environment.environment_url + '"' +
                                '   target="_blank"' +
                                '   class="blinken-environment ' + environment_style_class + '"' +
                                '>' +
                                '<p class="blinken-timestamp">' + environment.timestamp + '</p>' +
                                '<h2>' + environment.environment_name + '</h2>' +
                                '<div style="clear: right;">' +
                                critical_entries + warning_entries + unknown_entries + acknowledged_entries +
                                '</div>' +
                                '</a>' +
                                '</div>';

        self.$container.children("#" + group_id).append(environment_block);
      }
    });
  };

  Blinken.prototype.getEnvironmentStyleClass = function(critical_entries, warning_entries, unknown_entries, acknowledged_entries) {
    if (critical_entries > 0) {
      return "blinken-critical";
    } else if (warning_entries > 0) {
      return "blinken-warning";
    } else if (unknown_entries > 0) {
      return "blinken-unknown";
    } else if (acknowledged_entries > 0) {
      return "blinken-acknowledged";
    } else if (critical_entries == 0 && warning_entries == 0 && unknown_entries == 0 && acknowledged_entries == 0) {
      return "blinken-ok";
    } else {
      // For example, if the Icinga service is unreachable
      return "blinken-unavailable";
    }
  };

  Blinken.prototype.getEntryHTML = function(entry_type, entry_name, number_of_entries) {
    if (number_of_entries === 0) {
      return '<div class="blinken-entry"><h3>&nbsp;</h3><p>&nbsp;</p></div>';
    } else {
      return '<div class="blinken-entry blinken-' + entry_type + '-entries"><h3>' + number_of_entries + '</h3><p>' + entry_name + '</p></div>';
    }
  };

  blinken.Blinken = Blinken;

  $(document).ready(function() {
    new blinken.Blinken($(".status-indicators"));
  });
}());
