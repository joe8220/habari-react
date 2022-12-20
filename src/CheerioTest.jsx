import { load } from "cheerio";
import axios from "axios";
import { useEffect, useState } from "react";

const baseUrl = "https://apnews.com"
const apnewsUrl = `${baseUrl}/hub/world-news?utm_source=apnewsnav&utm_medium=navigation`;
// axios로 url에 있는 데이터 가져온다.

const CheerioTest = () => {
    const getNewsData = async () => {
        const result = await axios.get(apnewsUrl);
        const $ = load(result.data);
        const headlines = $('.CardHeadline');

        const newsList = [];

        // 10개 미만의 뉴스 기사
        for (let i = 0; i < Math.min(headlines.length, 10); i++) {
            const title = getTitle(headlines.get(i));
            const details = getDetailsUrl(headlines.get(i));
            // 가끔 details가 안 나오는 경우 있음 -> 깔끔히 무시
            if(!details) continue;

            const detailsPage = await axios.get(baseUrl + details);
            const $details = load(detailsPage.data);
            const articleChilds = $details('.Article')[0].childNodes; // class가 Article인 div 아래에 있는 <p> 태그 다 가져오기


            // trim -> 양쪽 공백 지우기, join -> string 합치기
            // child.data -> 그냥 <p> 안에 있는 텍스트 / child.children[0].data => <p> 안에 <a> 안에 있는 텍스트
            const article = articleChilds.map((c) => {
                const childrenParagraphs = c.children.map((child) => {
                    let paragraph = '';
                    try {
                        paragraph = child.data || child?.children[0].data || '';
                    } catch {
                        paragraph = ''; // 이상한거 나와서 오류 생기면 다 빈 string으로 퉁치기
                    }
                    return paragraph.trim();
                })
                return childrenParagraphs.filter(p => Boolean(p)).join(' ')
            }
            ).filter(item => item && item !== "ADVERTISEMENT")
            .join(' ');

            newsList.push({ title, article });
        }

        return newsList
    }

    const getTitle = (headline) => {
        try {
            return headline.children[0].children[0].children[0].data;
        } catch (error) {
            return ''
        }
    }
    const getDetailsUrl = (headline) => {
        return headline.children[0].attribs.href
    }

    const [newsList, setNewsList] = useState([]);

    useEffect(() => {
        getNewsData().then(list => setNewsList(list))
    })

    return (
        <div>
            {newsList.map((news, i) => (
                <div key={i}>
                    <p> <b>{news.title}</b> </p>
                    <p> {news.article.slice(0, 500)}... </p>
                </div>
            ))}
        </div>
    )
}

export default CheerioTest;