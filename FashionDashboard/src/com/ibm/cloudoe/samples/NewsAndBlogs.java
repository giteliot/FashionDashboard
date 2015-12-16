package com.ibm.cloudoe.samples;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.fluent.Response;

import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

/**
 * Servlet implementation class TwitterAnalysis
 */
@WebServlet("/NewsAndBlogs")
public class NewsAndBlogs extends HttpServlet {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private static Logger logger = Logger.getLogger(NewsAndBlogs.class
			.getName());

	//private String alchemyKey = "4202c06ba325660310662c0489eb61df79e9740b";
	// private String alchemyKey = "8176235156ba22f3fbf93e61b686f28793dc42f8"; //elia
	private String alchemyKey = "9eab986a3de917418ae8dfa3b3fa15661c6d031f"; //luca
	private String endpoint = "https://gateway-a.watsonplatform.net/calls/data/GetNews";
	private String baseURL = endpoint + "?apikey=" + alchemyKey;
	private String lastBit = "&return=enriched.url.url,enriched.url.title";

	public NewsAndBlogs() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		try {
			String qUrl = "";
			int count = 4;
			qUrl = formURL("json", "now-1d", "now", count,"burton","snowboard");
			System.err.println(qUrl);
			URI myURI = new URI(qUrl).normalize();

			Response r = Request.Get(myURI).execute();
			HttpResponse httpResponse = r.returnResponse();

			JSONObject jsonResp = JSONObject.parse(httpResponse.getEntity()
					.getContent());
			JSONArray jsonArr = new JSONArray();
			//jsonArr = (JSONArray) jsonResp.get("result.docs[]");
			jsonArr = (JSONArray) jsonResp.get("result.docs[]");
			JSONArray toDashboard = new JSONArray();
			for (int i = 0;i<count;i++) {
				
				JSONObject result = (JSONObject) jsonResp.get("result");
				JSONObject docsi = (JSONObject) ((JSONArray) result.get("docs")).get(i);
				JSONObject source = (JSONObject) docsi.get("source");
				JSONObject enriched = (JSONObject) source.get("enriched");
				JSONObject urlObj = (JSONObject) enriched.get("url");
				String title = (String) urlObj.get("title");
				String url = (String) urlObj.get("url");
				JSONObject urlField = new JSONObject();
				urlField.put(title, url);
				
				
				toDashboard.add(urlField);
			}
			PrintWriter writeOut = resp.getWriter();
			if (toDashboard != null) {
				writeOut.print(toDashboard);
				writeOut.flush();
				writeOut.close();
			} else
				System.err.println("sono in da ELSE");
				writeOut.print(JSONObject.parse(httpResponse.getEntity()
						.getContent()));
		} catch (Exception e) {
			// logger.log(Level.SEVERE, "Service error: " + e.getMessage(), e);
			resp.setStatus(HttpStatus.SC_BAD_GATEWAY);
			System.err.println("brutto");
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		doGet(req, resp);

	}

	protected String formURL(String outputType, String start, String end,
			int count, String filter1, String filter2) {
		String output = "";
		if (outputType == "json" || outputType == "JSON"
				|| outputType == "Json")
			output = "&outputMode=json";
		else if (outputType.toLowerCase() == "xml")
			output = "&outputMode=xml";
		else
			System.err.println("unrecognized output mode");

		String pStart = "&start=" + start;
		String pEnd = "&end=" + end;
		String pCount = "&count=" + count;
		String pFilters = "&q.enriched.url.text="+filter1+"&q.enriched.url.text="+filter2;
		//String pFilters = "&q.enriched.url.concepts.concept.text=" + filter1;
		return baseURL + output + pStart + pEnd + pCount + pFilters + lastBit;
	}

}
