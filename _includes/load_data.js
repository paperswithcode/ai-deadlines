
var subs = [];
var _all_subs = [];
// Get all subs
var conf_type_data = {{ site.data.types | jsonify}};
var sub2name = {}; var name2sub = {};
for (var i = 0; i < conf_type_data.length; i++) {
    _all_subs[i] = conf_type_data[i]['sub'];
    sub2name[conf_type_data[i]['sub']] = conf_type_data[i]['name'];
    name2sub[conf_type_data[i]['name']] = conf_type_data[i]['sub'];
}
const all_subs = _all_subs;

