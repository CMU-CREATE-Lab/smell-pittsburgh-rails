/*Creates twitter like feed of most recent smell reports*/


//~~~~~~~~~Global variables~~~~~~~~~~~~~~~~
//veiw port
//An object of widely used varuables that are mostly only configured at the beginning of the program
var constants={
    id:"",//id of the element to turn into the feed div
    path:"",//path to the needed images
    regionId:"",//id of region to get reports from
    end:0,
    numbDivsToLoad:0//the total maxium number of smell reports
}

var isLoadMore=false; //used to tell if this is the very first setup of the div or if one is loading more reports
var newReps=false;//used to tell if is loading newdivs from update timer
var load=10; //the number of reports to load per click of load more
var loadedSmells=[]; //array to store smell reports
var oldLen=loadedSmells.length;//used to determin starting place for four loop
var updateDelay=60*1000; //delay in seconds to check the database for more recent smell reports
var wid="97px";//width of container as a string with units
var hi="50%";//height of container as a string with units
var divAsStr="";//used to store original configuraion of div
var addedID="2";//a string to create a known different id of the div to be placed inside the given div
var oldLoad=0;//the number of reports previously displayed before load more was pressed
var isSetUp=true;//set up the div in a special formate but only the first update when opened
var apiRoot="http://api.smellpittsburgh.org";
var apiURL=apiRoot+"/api/v2/smell_reports?region_ids="; // the beginning of the api url for easy referance
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // example method call for pittsburgh genFeed(1,"reportFeed","./img/");
		
	
/*initail method 
 *takes:
 *	the region to load reports from
 *	the id of element to put the feed in 
 *	and a path to the needed images
 *Calls genDivs sets up constants object
*/
    function genFeed(regionID,elemID,path){
		//current unix time
        var now=new Date();
        newReps=false;
        isSetUp=true;
        if(saveUptTime<updateDelay&&saveUptTime!=0&&updateDelay>(24*60*60*1000*365)-1){
            updateDelay=saveUptTime;
        }
		//get most recent local time midnight
		var localMidnight=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
		localMidnight=localMidnight.getTime()/1000;
        // url to get day week of smell reports
        var url=apiURL+""+regionID+"&start_time="+(localMidnight);
		//set up constants object
        constants.id=elemID;
        constants.regionId=regionID;
        constants.end=localMidnight;
        constants.path=path;
        constants.numbDivsToLoad=load;
		//save configurtion of div for when it is minimized
		divAsStr=document.getElementById(constants.id).outerHTML+"";

		//request week of smell reports
        $.getJSON(url, function(data){
			//store them as arr and pass into genDivs
            data.sort(function(a,b){
                return a.observed_at-b.observed_at;
            });
            data=data.reverse();
            loadedSmells=data;
            oldlen=loadedSmells.length;
            genDivs(data);
        });
    }

	
	/* important function used to create an array of divs to add to the page
	 *takes and array of smell reports
	 *requires constants object to be configured
	 *calls appendDivs and formatDiv
	 */
    function genDivs(arr){
        var html=[]; //array to store divs as strings
        var count=0; //tracks the number of divs created
        var start=arr.length-constants.numbDivsToLoad; //where the for loop should start based on the number of divs already displayed
        var gotTab= document.getElementById(constants.id+""+addedID);
        start=oldLen;//start at old length so there are no repeats
		//iterate through all smell reports
        for(var i=start;i<arr.length;i++){
            //dont load more than 10
            if(count<load){
                //method to generate the actual div text
                html.push(formatDiv(arr[i]));
            }
            count++;
        }
        //update the length holding variable
        oldLen=arr.length
        //newReps that come in are still in reverse order so must be reversed
        if(newReps){
            arr.reverse();
        }
        appendDivs(html);
    }
    /*This was made into its own function because it was going to be called from other places but now isnt
     * takes a smeel report object
     *constants must be loaded correctly
     * return a string that is the div we want to display for the report passed in
     */
    function formatDiv(rep){
        //this part is bad formating that needed an eay fix from the old implementation-----
        let i=0;
        let arr=[rep]
        //---------
            var date= new Date(arr[i].observed_at*1000);//JavaScript date object for the time the rport was made
            var strDate=date.getMonth()+1+"/"+date.getDate()+"/"+date.getFullYear(); //the dtae as a string to be displayed
            //------ variables to create a properly formated string  to display time --------
			var strTime="";
            var hour=parseInt(date.getHours());
            var sec=date.getSeconds();
            var min=date.getMinutes();
            var meridian="AM";
			//------------------
            var smellRating=arr[i].smell_value; //smell value 1-5
            var sympt=arr[i].feelings_symptoms;//symptoms from report
            var desc=arr[i].smell_description;//description from report
            var img=constants.path+"smell_"+smellRating+".png";//the name of the image to use based on smell value
			//---- replace nulls with "No data"
            if(sympt==null){
                sympt="No data";
            }
            if(desc==null){
                desc="No data";
            }
			//--------------------
			//format time string with leading zero so it displays better-----------
            if(hour>=12){
                meridian="PM"
            }
            if(hour>12||hour==0){
                hour=Math.abs(hour-12);
            }
            if(hour<10){
                hour="0"+hour;
            }
            if(sec<10){
                sec="0"+sec;
            }
            if(min<10){
                min="0"+min;
            }
            strTime=hour+":"+min+":"+sec;
			//--------------------------
			//check if smell report is new and if the html array has fewer than the maxium number of elements
			// standard div format for each smell report
            var div="<tr><td style='text-align:center'><img style='width:25px;display:inline-block;padding: 0 15px; 'src='"+img+"'><div data='"+strTime+"'style='padding-top:3px;text-align:left'><b>Description:</b> "+desc+"<br>"+
            "<b>Date:</b> "+strDate+"</div><hr/></td></tr>";
            return div;


    }

	
	//used to have functionality now is just calls appendHelper
    function appendDivs(arrOfDivs){
        appendHelper(arrOfDivs);
    }

//minimize the div (return it to its orginal state)
//requires constants object to be configured and calls genFeed
var saveUptTime=0;
	function minimizeDiv(){
        isLoadMore=false;
        saveUptTime=updateDelay;
        updateDelay=24*60*60*1000*365;
        oldLen=0;
		//two jquery look ups seem to be needed so that the on click event is correctly added
		$("#"+constants.id).replaceWith(divAsStr);
		$("#"+constants.id).on("click", function () {
			genFeed(1,"report-feed","/img/")
		});
	}
//when the new flag is clicked brings you to top of list and deletes the new flag
    function scrollToTop(){
        var elem = document.getElementById(constants.id+""+addedID);
        elem.scrollTop=0;
        $("#newDiv").replaceWith("")
    }
	
/* adds the smell reports to the page and stylizes the div
 *takes array of divs as strings
 *requires constants object to be configured
 *calls timedUpdate() and ajustScroll()
*/
    function appendHelper(arr){
        //reverse array so most recent is first
		// standard layout for the load more button
        var button="<tr id='buttonRow'><td colspan=\"2\" style='font-size:7px;text-align:center'><button onclick='loadMore()'id='load-button'>Load More</button><hr/></td></tr>";        
        //if we have loaded all reports from the last day then display a message saying so
		if(arr.length<constants.numbDivsToLoad-oldLen||loadedSmells.length<load){
           button="<tr id='buttonRow'><td colspan=\"2\"><h3 style='text-align:center'>There are no more recent smell reports</h3><hr/></td></tr>";
        }
        //onclick empty
		//formate for the x minimizing button
		var x="<div title='close'class='bigger'onclick='minimizeDiv()'id='x-button'><b>X</b></div>";
		// a sticky footer for the div
		var sticky="<div id='stickyB'>"+x+"</div>";
        var newDiv="<div id='newDiv' onclick='scrollToTop()'>New!</div>"
        var header="<div id='feed-header'class='feed-header-responsive'>Recent Smell Reports</div>";

		//Only format the div the first time opened (isSetup=true)
        if(isSetUp){
            //get the div we want to edit and replace it with a known format
            $("#"+constants.id).replaceWith("<div id='"+constants.id+"'class='report-feed-width'><div id='"+constants.id+""+addedID+"'><table></table></div></div>");
            //get the inner div
            var elem = document.getElementById(constants.id+""+addedID);
            //set up scrolling
            elem.style="overflow-y: scroll;width:100%;";
		    elem = document.getElementById(constants.id);
            //set div width and height
		    elem.style="height:"+hi;//width:"+wid;
             $("#"+constants.id).prepend(header);
            //get the table from the above
            var tab=$("#"+constants.id+addedID)[0].children[0];
            tab.id="tab";
        }
        //always prepend the smell reports
        if(isLoadMore){
        $("#buttonRow").replaceWith("")
        $("#tab").append(arr.join(''));
        $("#tab").append(button);
        }else{
        $("#tab").prepend(arr.join(''));
        }

        //if set up append these last
        if(isSetUp){
            $("#"+constants.id).append(sticky);
            $("#tab").append(button);
        }else{
            //if not set up the check if need to replace new or load more
            if(newReps){
                 //add new flag
                $("#feed-header").replaceWith("<div id='feed-header'class='feed-header-responsive'>Recent Smell Reports"+newDiv+"</div>");
            }
            if(arr.length<constants.numbDivsToLoad-oldLen){
                //switch load more button
                $("#load-button").replaceWith("<h3 style='text-align:center'>There are no more recent smell reports</h3>");
            }
        }
        //everything has been setup so isSetUp should now be false
        isSetUp=false;	
		//set up the timed update
        timedUpdate();
        
    }
	

	
/* loads more reports
 * calls genDivs
 *constants must be configured
 */
    function loadMore(){
        //oldLoad=document.getElementById("tab").rows.length;
        oldLen=constants.numbDivsToLoad
        constants.numbDivsToLoad+=load;//updates the number of total divs to display
        //telling append methods which thing to use
        isLoadMore=true;
        newReps=false;
        //constants.end-=86400;// updates how far back to get reports from
        genDivs(loadedSmells)
    }

/* made into independant function so that it can be called from the console
 *constants must be fomated correctly
 *calls genDivs
 */
    function upt(){
        //local variables ----------------------------
        var now=new Date();//current time js date object
        var offset=updateDelay/1000;//updateDelay in seconds rather than miliseconds
		var n=Math.floor(new Date().getTime()/1000);//current unix time
		var localMidnight=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);//the most recent midnight
		localMidnight=localMidnight.getTime()/1000;//convert to seconds
        var req=apiURL+""+constants.regionId+"&start_time="+(localMidnight);//get all reports for day
        var url=apiURL+""+constants.regionId+"&start_time="+(n-offset);//url to get reports in last offset seconds
        var areNewReps=false; //boolean to determin wheather or not valid new reports were recieved
        //--------------------------------------------

        $.getJSON(url,function(data){
			//if there are recent reports and they arent equal to the most recent report then update the list with them
            data.sort(function(a,b){
                return a.observed_at-b.observed_at;
            });
            //reverse the array so thy line up for the if checks
           data=data.reverse();
           // there are reports and the last reports arent the same
            if(data.length>0){
                var repsSameTime=(loadedSmells[loadedSmells.length-1].observed_at===data[data.length-1].observed_at);
                var descSame=(loadedSmells[loadedSmells.length-1].smell_description===data[data.length-1].smell_description);
                areNewReps=data.length>0&&(!repsSameTime||(repsSameTime&&!descSame));
           }
            //second check incase two independant reports were sent at the same time
            if(areNewReps){
                //requested all reports and repeate process with genDivs
                $.getJSON(req, function(data2){
                    data2.sort(function(a,b){
                        return a.observed_at-b.observed_at;
                    });      
                    //conditions for genDIvs
                    isLoadMore=false;
                    newReps=true;
                    loadedSmells=data2;
                    genDivs(data2);
                });
            }
        });
    }
	
	/*queries data base to see if there are new reports on an interval*/
    function timedUpdate(){
        window.setInterval(function() {
        upt();
    }, updateDelay);

    }


