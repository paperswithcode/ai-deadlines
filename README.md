## [AD Deadlines](https://ad-deadlines.com)

Countdown timers to keep track of a bunch of conference deadlines in the field of autonomous driving (AD).

Inspired by [aideadlin.es](https://aideadlin.es/?sub=ML,CV,RO), [esrlabs](https://github.com/esrlabs/Conferences-for-Autonomous-Driving) & [jackietseng](https://jackietseng.github.io/conference_call_for_paper/conferences-with-ccf.html).

## Contributing

Contributions are very welcome!

To add or update a deadline:
- Fork the repository
- Update [`_data/conferences.yml`](https://github.com/daniel-bogdoll/ad-deadlines/blob/gh-pages/_data/conferences.yml)
- Make sure it has all the attributes!
    + See available timezone strings [here](https://momentjs.com/timezone/).
    + `hindex` refers to h5-index from [here](https://scholar.google.com/citations?view_op=top_venues&hl=en)
- Optionally add a `note` and `abstract_deadline` in case the conference has a separate mandatory abstract deadline
- Send a pull request

### Example Contribution
This is how the CVPR conference 2022 is integrated into the website:
```
[...]
- title: CVPR
  long: Conference on Computer Vision and Pattern Recognition
  hindex: 356
  year: 2022
  id: cvpr22
  link: http://cvpr2022.thecvf.com/
  deadline: '2021-11-16 23:59:59'
  timezone: America/Los_Angeles
  date: June 19-22, 2022
  place: New Orleans, Louisiana, USA
  sub: CV
  host: IEEE/CVF
[...]
```

\* You're missing a conference? Simply create a [pull request](https://github.com/daniel-bogdoll/ad-deadlines/blob/gh-pages/_data/conferences.yml) ;)

