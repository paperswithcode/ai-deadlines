
      // calendar data template
      var calendar_data = {
        clickDay: function (e) {
          if (e.events.length > 0) {
            for (var i in e.events) {
              window.open("{{site.baseurl}}/conference?id=" + e.events[i].abbreviation, "_self")
            }
          }
        },
        mouseOnDay: function (e) {
          if (e.events.length > 0) {
            var content = "";

            for (var i in e.events) {
              var icon_html = "";
              var headline_color = "";
              var break_html = '<hr>';

              var location_html = '<img src="{{site.baseurl}}/static/img/072-location.svg" className="own-badge"/>&nbsp;' + e.events[i].location;
              var date_html = '<img src="{{site.baseurl}}/static/img/084-calendar.svg" className="own-badge"/>&nbsp;' + e.events[i].date;

              var badges_html = "";
              var subs = e.events[i].subject.split(',');
              for (let i = 0; i < subs.length; i++) {
                var sub = subs[i].replace(" ", "");
                badges_html += '<span class="conf-sub conf-badge-small">' + sub + '</span>'
              }
              if (e.events[i].ranking != "" && e.events[i].ranking != "NA") {
                badges_html += '<span class="conf-ranking conf-badge-small">' + e.events[i].ranking + '</span>'
              }
              if (e.events[i].hindex != "") {
                badges_html += '<span class="conf-h5 conf-badge-small">' + e.events[i].hindex + '</span>'
              }

              if (i == e.events.length - 1) {
                break_html = '';
              }


              if (e.events[i].id.endsWith("deadline")) {
                headline_color = 'deadline-text';
              } else {
              }
              content +=
                '<div class="event-tooltip-content">' +
                '<div class="event-name ' + headline_color + '">' +
                '<b>' + e.events[i].name + '</b> &nbsp;' + icon_html +
                '</div>' +
                '<div class="event-location">' +
                location_html +
                '<br>' +
                date_html +
                '<br>' +
                badges_html +
                '</div>' +
                break_html +
                '</div>';
            }

            $(e.element).popover({
              trigger: "manual",
              container: "body",
              html: true,
              content: content,
            });

            $(e.element).popover("show");
          }
        },
        mouseOutDay: function (e) {
          if (e.events.length > 0) {
            $(e.element).popover("hide");
          }
        },
        customDayRenderer: function (cellContent, currentDate) {
          var today = new Date();
          // render today
          if (today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === currentDate.getDate()) {
            cellContent.style = "background-color: gray;";
          }
        },
        dayContextMenu: function (e) {
          $(e.element).popover("hide");
        },
        dataSource: conf_list_all
      }