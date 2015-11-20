/// <reference path="../typings/custom.d.ts" />
var xmlEncode = require('xml-escape');
var SoapXmlHelper = (function () {
    function SoapXmlHelper() {
    }
    SoapXmlHelper.buildExecuteRequest = function (soapRequestBodyXml) {
        return ['<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
            ' <soap:Body>',
            '   <Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            soapRequestBodyXml,
            '     </Execute>',
            '   </soap:Body>',
            ' </soap:Envelope>'
        ].join('');
    };
    SoapXmlHelper.buildFetchAttributeXml = function (columns) {
        var attributes = [];
        for (var i = 0, max = columns.length; i < max; i++) {
            attributes.push('<attribute name="' + columns[i] + '" />');
        }
        return attributes.join('');
    };
    SoapXmlHelper.buildGetByIdFetchXml = function (id, entityname, columns) {
        var idAttribute = entityname + 'id';
        return [
            '<fetch version="1.0">',
            '  <entity name="' + entityname + '">',
            this.buildFetchAttributeXml(columns),
            '    <filter type="and">',
            '      <condition attribute="' + idAttribute + '"',
            '          operator="eq" value="' + id + '" />',
            '    </filter>',
            '  </entity>',
            '</fetch>'
        ].join('');
    };
    SoapXmlHelper.getRetrieveRequest = function (id, entityname, columns) {
        var requestColumns;
        if (columns) {
            requestColumns = columns.map(function (col) {
                return '<c:string>' + col + '</c:string>';
            }).join('');
        }
        var requestBodyXml = [
            '<request i:type="a:RetrieveRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">',
            '	<a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">',
            '	  <a:KeyValuePairOfstringanyType>',
            '	    <b:key>Target</b:key>',
            '	    <b:value i:type="a:EntityReference">',
            '	      <a:Id>', id, '</a:Id>',
            '	      <a:LogicalName>', entityname, '</a:LogicalName>',
            '	      <a:Name i:nil="true" />',
            '	    </b:value>',
            '	  </a:KeyValuePairOfstringanyType>',
            '	  <a:KeyValuePairOfstringanyType>',
            '	    <b:key>ColumnSet</b:key>',
            '	    <b:value i:type="a:ColumnSet">',
            '	      <a:AllColumns>false</a:AllColumns>',
            '       <a:Columns xmlns:c="http://schemas.microsoft.com/2003/10/Serialization/Arrays">',
            requestColumns,
            '       </a:Columns>',
            '	    </b:value>',
            '	  </a:KeyValuePairOfstringanyType>',
            '	</a:Parameters>',
            '	<a:RequestId i:nil="true" />',
            '	<a:RequestName>Retrieve</a:RequestName>',
            '</request>'
        ].join('');
        return this.buildExecuteRequest(requestBodyXml);
    };
    SoapXmlHelper.getFetchMoreXml = function (fetchxml) {
        return [
            '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
            ' <s:Body>',
            '  <Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">',
            '     <request i:type="b:RetrieveMultipleRequest" xmlns:b="http://schemas.microsoft.com/xrm/2011/Contracts" ',
            '         xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            '             <b:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">',
            '             <b:KeyValuePairOfstringanyType>',
            '                 <c:key>Query</c:key>',
            '                 <c:value i:type="b:FetchExpression">',
            '                     <b:Query>',
            xmlEncode(fetchxml),
            '                     </b:Query>',
            '                 </c:value>',
            '             </b:KeyValuePairOfstringanyType>',
            '         </b:Parameters>',
            '         <b:RequestId i:nil="true"/>',
            '         <b:RequestName>RetrieveMultiple</b:RequestName>',
            '     </request>',
            ' </Execute>',
            '</s:Body></s:Envelope>'
        ].join('');
    };
    SoapXmlHelper.getAssignXml = function (id, entityname, assigneeId, assigneeEntityName) {
        return [
            '<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">',
            '  <s:Body>',
            '    <Execute xmlns=\"http://schemas.microsoft.com/xrm/2011/Contracts/Services\" ',
            '           xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\">',
            '      <request i:type=\"b:AssignRequest\" xmlns:a=\"http://schemas.microsoft.com/xrm/2011/Contracts\" ',
            '           xmlns:b=\"http://schemas.microsoft.com/crm/2011/Contracts\">',
            '        <a:Parameters xmlns:c=\"http://schemas.datacontract.org/2004/07/System.Collections.Generic\">',
            '          <a:KeyValuePairOfstringanyType>',
            '            <c:key>Target</c:key>',
            '            <c:value i:type=\"a:EntityReference\">',
            '              <a:Id>' + id + '</a:Id>',
            '              <a:LogicalName>' + entityname + '</a:LogicalName>',
            '              <a:Name i:nil=\"true\" />',
            '            </c:value>',
            '          </a:KeyValuePairOfstringanyType>',
            '          <a:KeyValuePairOfstringanyType>',
            '            <c:key>Assignee</c:key>',
            '            <c:value i:type=\"a:EntityReference\">',
            '              <a:Id>' + assigneeId + '</a:Id>',
            '              <a:LogicalName>' + assigneeEntityName + '</a:LogicalName>',
            '              <a:Name i:nil=\"true\" />',
            '            </c:value>',
            '          </a:KeyValuePairOfstringanyType>',
            '        </a:Parameters>',
            '        <a:RequestId i:nil=\"true\" />',
            '        <a:RequestName>Assign</a:RequestName>',
            '      </request>',
            '    </Execute>',
            '  </s:Body>',
            '</s:Envelope>'
        ].join('');
    };
    return SoapXmlHelper;
})();
exports.SoapXmlHelper = SoapXmlHelper;
