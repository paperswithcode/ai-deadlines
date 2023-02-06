## HCI Deadlines ![GitHub license](https://img.shields.io/badge/license-MIT-red.svg?style=flat-square)


Countdown timers to keep track of a bunch of Human-Computer Interaction conference deadlines.

This is a fork of the [ai-deadlines](https://github.com/paperswithcode/ai-deadlines) website.

## Contributing

Contributions are very welcome!

To keep things minimal, I'm only looking to list top-tier conferences in AI as per [conferenceranks.com][6] and my judgement calls. Please feel free to maintain a separate fork if you don't see your sub-field or conference of interest listed.

To add or update a deadline:

- Fork the repository
- Update `_data/conferences.yml`
- Make sure it has the `title`, `year`, `id`, `link`, `deadline`, `timezone`, `date`, `place`, `sub` attributes
  - See available timezone strings [here](https://momentjs.com/timezone/).
- Optionally add a `note` and `abstract_deadline` in case the conference has a separate mandatory abstract deadline
- Optionally add `hindex` (refers to h5-index from [here](https://scholar.google.com/citations?view_op=top_venues&vq=eng))
- Example:
  ```yaml
  - title: BestConf
    year: 2022
    id: bestconf22 # title as lower case + last two digits of year
    full_name: Best Conference for Anything # full conference name
    link: link-to-website.com
    deadline: YYYY-MM-DD HH:SS
    abstract_deadline: YYYY-MM-DD HH:SS
    timezone: Asia/Seoul
    place: Incheon, South Korea
    date: September, 18-22, 2022
    start: YYYY-MM-DD
    end: YYYY-MM-DD
    paperslink: link-to-full-paper-list.com
    pwclink: link-to-papers-with-code.com
    hindex: 100.0
    sub: SP
    note: Important
  ```
- Send a pull request

## License

This project is licensed under [MIT][1].

It uses:

- [IcoMoon Icons](https://icomoon.io/#icons-icomoon): [GPL](http://www.gnu.org/licenses/gpl.html) / [CC BY4.0](http://creativecommons.org/licenses/by/4.0/)

[1]: https://abhshkdz.mit-license.org/
[2]: http://aideadlin.es/
[3]: https://github.com/LukasMosser/geo-deadlines
[4]: https://github.com/tbryn/neuro-deadlines
[5]: https://github.com/dieg0as/ai-challenge-deadlines
[6]: http://www.conferenceranks.com/#
[8]: https://m3dv.github.io/ai-deadlines/
[9]: https://ekut-es.github.io/es-deadlines/
[10]: https://jackietseng.github.io/conference_call_for_paper/conferences.html
[11]: https://ccfddl.github.io/
[12]: https://netdeadlines.com/
[13]: https://ad-deadlines.com/
[14]: https://sec-deadlines.github.io/
[15]: https://pythondeadlin.es/
[16]: https://deadlines.openlifescience.ai/
