pragma solidity 0.8.9;

contract Asset {
    // Model a property
    struct Property {
        uint id;
        string name;
        uint price;
        address owner;
    }

    mapping(uint => Property) public Properties;
    // Store property Count
    uint public propertyCount;

    // boughtEvent event
    event boughtEvent (
        uint indexed _propertyId
    );

    constructor () public {
        addProperty("Property 1");
        addProperty("Property 2");
        addProperty("Property 3");
        addProperty("Property 4");
    }

    function addProperty (string memory _name) private {
        propertyCount ++;
        Properties[propertyCount] = Property(propertyCount, _name, 50, 0xafCE0df05Daff78cF57Ae904FBc7288b8189fB62);
    }

    function buy (uint _propertyId) public {
        // require that they dont already own the property before
        require(msg.sender!=Properties[_propertyId].owner);

        // update owner of property
        Properties[_propertyId].owner= msg.sender ;

        // trigger bought event
        emit boughtEvent(_propertyId);
    }
}
