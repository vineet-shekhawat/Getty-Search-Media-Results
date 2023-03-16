import React, { useState } from "react";
import {gettyApiKey, gettyApiSecret, keywordForImagesWithText} from './constants';
import Gallery from 'react-photo-gallery';
const api = require("@vineetshekhawat/gettyimages-api");
var posTagger = require( 'wink-pos-tagger' );

function FilterComponent() {

    const [data, setData]  = useState([]);
    const [taggers,SetTaggers] = useState(false);
    const [searchTerm,setSearchTerm] = useState("");
    const [style,setStyle] = useState("");
    const [textCheckBox, setTextCheckBox] = useState(false);
    const [mediaCount, setMediaCount] = useState(5);
    const [videoCheckBox, setVideoCheckBox] = useState(false);
    const [photoList, setPhotoList] = useState([]);
    const [detailCheckBox, setDetailCheckbox] = useState(false);

    function avoidTextCheckBoxStatus() {
        // Get the checkbox
        var checkBox = document.getElementById("textCheckBox");
        // If the checkbox is checked, update state
        if (checkBox.checked === true){
            setTextCheckBox(true);
        } else {
            setTextCheckBox(false);
        }
    }

    const enterPressed = () => {
        console.log('pressed Enter ✅');
        document.getElementById('SearchButton').click();
      };

    React.useEffect(() => {
        const keyDownHandler = event => {    
          if (event.key === 'Enter') {
            event.preventDefault();
            enterPressed();
          }
        };
        document.addEventListener('keydown', keyDownHandler);  
        return () => {
          document.removeEventListener('keydown', keyDownHandler);
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

    function detailCheckBoxStatus() {
        // Get the checkbox
        var checkBox = document.getElementById("detailCheckBox");
        // If the checkbox is checked, update state
        if (checkBox.checked === true){
            setDetailCheckbox(true);
        } else {
            setDetailCheckbox(false);
        }
    }

    function filteredQuery() {
        // Get the checkbox
        var checkBox = document.getElementById("filterQuery");
        // If the checkbox is checked, update state
        if (checkBox.checked === true){
            SetTaggers(true);
        } else {
            SetTaggers(false);
        }
    }

    function videoResultsCheckBoxStatus() {
        // Get the checkbox
        var checkBox = document.getElementById("videoCheckBox");
        // If the checkbox is checked, update state
        if (checkBox.checked === true){
            setData([]);
            setPhotoList([]);
            document.getElementById('graphicStyle').disabled = true;
            document.getElementById('textCheckBox').disabled = true;
            document.getElementById('detailCheckBox').disabled = true;
            setDetailCheckbox(true);
            setVideoCheckBox(true);
        } else {
            setPhotoList([]);
            setData([]);
            document.getElementById('graphicStyle').disabled = false;
            document.getElementById('textCheckBox').disabled = false;
            document.getElementById('detailCheckBox').disabled = false;
            document.getElementById('detailCheckBox').checked = false; // always start with photo gallery
            setVideoCheckBox(false);
            setDetailCheckbox(false);
        }
    }

    async function FetchGettyImages() {
        var creds = { apiKey: gettyApiKey, apiSecret: gettyApiSecret };
        var client = new api(creds);
        document.getElementById("SearchButton").disabled = true;
        document.getElementById("videoCheckBox").disabled = true;

        if(searchTerm === "")
        {
            setPhotoList([]);
            setData([]);
            console.log("empty string- nothing available");
            document.getElementById("SearchButton").disabled = false;
            return;
        }

        //FetchQueryFromSearchTerm(); //national cookie day
        var sq = "";
        if(taggers)
        {
            var tagger = posTagger();
            var tokens = tagger.tagSentence( searchTerm );
            tokens = tokens.filter((token) => token.tag === "word");
            tokens.map((token) => {
                if (["NN", "NNS", "NNP", "NNPS"].includes(token.pos)) { //, "JJ", "JJR", "JJS"
                    if(sq === "") sq = token.value;
                    else sq = sq.concat(" ",token.value);
                    return sq;
                }
            });
        }

        const query = sq ==="" ? searchTerm : sq;
        //console.log('search term: '+ searchTerm, "post processing: ", query);

        if(videoCheckBox)
        {
            var searchVideosQuery = client.searchvideos().withPage(1).withPageSize(mediaCount); // add count of images
            searchVideosQuery.withPhrase(query); // add search term
            const searchResponse = await searchVideosQuery.execute(); //fetch response
            setData(searchResponse.videos);
            console.log("response video", searchResponse.videos);
            document.getElementById("SearchButton").disabled = false;
            document.getElementById("videoCheckBox").disabled = false;
            return;
        }

        var searchQuery = client.searchimagescreative().withPage(1).withPageSize(mediaCount); // add count of images
        if(textCheckBox) searchQuery.withExcludeKeywordId(keywordForImagesWithText); // exclude images with text
        if(style !== "" && style !== "all") searchQuery.withGraphicalStyle(style); // add graphic style if any
        searchQuery.withSafeSearch(true).withPhrase(query).withSortOrder("best_match"); // add search term
        const searchResponse = await searchQuery.execute(); //fetch response
        setData(searchResponse.images);
        document.getElementById("SearchButton").disabled = false;
        document.getElementById("videoCheckBox").disabled = false;
        console.log("response images", searchResponse.images);
        const newPhotoList = [];
        for(let item of searchResponse.images )
        {
            const imgObj = {
                src: item.display_sizes[0].uri ?? '',
                width: item.max_dimensions.width,
                height: item.max_dimensions.height
            };
            newPhotoList.push(imgObj);
        }
        setPhotoList(newPhotoList);
    }       
    return <>
        <div className="title">
            <h1 className="heading">Search Getty Images</h1>
        </div>
        <div className="body">
            <div>
                <input style= {{marginRight: '10px'}} type="text" name="textfield" id="textfield" placeholder="Search media for text..." onChange={(e)=> setSearchTerm(e.target.value)} />
                <select style= {{marginRight: '10px'}} id="graphicStyle" onChange={(e)=> setStyle(e.target.value)}>
                    <option value="all">all styles</option>
                    <option value="photography">photography</option>
                    <option value="illustration">illustration</option>
                    <option value="vector">vector</option>
                </select>
                <input style= {{marginRight: '10px', width: '25px'}} type="text" name="textfield" id="textfield" placeholder="5" onChange={(e)=> setMediaCount(e.target.value)} />
                <input style= {{marginRight: '10px'}} name="" type="button" id= "SearchButton" value="Search" onClick={()=> FetchGettyImages()}></input>
                <input type="checkbox" id="textCheckBox" onClick={()=>avoidTextCheckBoxStatus()}/>
                <label style= {{marginRight: '20px'}} id="textCheckBox"> Without text</label>
                <input type="checkbox" id="videoCheckBox" onClick={()=>videoResultsCheckBoxStatus()}/>
                <label style= {{marginRight: '20px'}} id="videoCheckBox"> Videos </label>
                <input type="checkbox" id="detailCheckBox" onClick={()=>detailCheckBoxStatus()}/>
                <label style= {{marginRight: '20px'}} id="detailCheckBox"> Show Details</label>
                <input type="checkbox" id="filterQuery" onClick={()=>filteredQuery()}/>
                <label id="filterQuery"> Query Processor</label>
            </div>
            <h2>List of Media</h2>
            <span>For best Results From Getty API: Use style as Photography and Without Text</span>
            { !detailCheckBox && <div id="gallery">
                <br></br>
                <br></br>
                <Gallery photos={photoList} />
            </div> }
            { detailCheckBox && <ul className="items-unorder">
                {data
                    // .filter((data) => data.title.toLowerCase().includes(input))
                    .map((items)=> {
                    return (
                        <>  
                            <li className="items-list" key={items.id}>
                                <div className="card">
                                    <div className="card-content">
                                        <h3>{items.id}</h3>
                                        {
                                            videoCheckBox
                                            ?   <video width="200px" height= "175px" controls="controls" transform= "translate(-50%)">
                                                    <source src= {items.display_sizes[0].uri} type="video/mp4"/>
                                                </video>
                                            :   <img src={ items.display_sizes[0].uri } alt={'hi'} width="200px" height="175px"></img>
                                        }
                                        <span className="sub-title">
                                            <a  target="_blank" rel="noopener noreferrer" href={items.display_sizes[0].uri}>MediaLink</a>
                                        </span>
                                    </div>
                                    <div className="edge-right"></div>
                                </div>
                            </li>  
                        </>
                    )
                })}
            </ul> 
            }
        </div>
    </>
}
export default FilterComponent;