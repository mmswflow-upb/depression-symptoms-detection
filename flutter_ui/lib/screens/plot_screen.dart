import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:convert';

class PlotScreen extends StatefulWidget {
  const PlotScreen({Key? key}) : super(key: key);

  @override
  _PlotScreenState createState() => _PlotScreenState();
}

class _PlotScreenState extends State<PlotScreen> {
  Map<String, List<double>> _symptomData = {};
  List<double> _generalMoodScores = []; // General mood score (0.0 to 1.0)
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSymptomScores();
  }

  Future<void> _fetchSymptomScores() async {
    try {
      final String apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000';
      final response = await http.get(Uri.parse('$apiUrl/fetch-scores'));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final Map<String, List<double>> symptomData = {};
        final List<double> generalMoodScores = []; // List for mood scores

        for (var conversation in data) {
          // Update symptom scores
          conversation['finalScores'].forEach((symptom, score) {
            symptomData.putIfAbsent(symptom, () => []).add(score.toDouble());
          });

          // Add general mood score
          if (conversation['generalMoodScore'] != null) {
            generalMoodScores.add(1.0 - conversation['generalMoodScore'].toDouble());
          }
        }
        print(generalMoodScores.toString());

        setState(() {
          _symptomData = symptomData;
          _generalMoodScores = generalMoodScores;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        throw Exception('Failed to fetch data');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      print("Error fetching scores: $e");
    }
  }


  Widget _buildGeneralMoodGraph(List<double> moodScores) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: SfCartesianChart(
          title: ChartTitle(
            text: "General Mood Score Over Conversations",
            textStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          primaryXAxis: NumericAxis(
            title: AxisTitle(text: 'Conversation Number'),
            minimum: 1,

            edgeLabelPlacement: EdgeLabelPlacement.shift,
          ),
          primaryYAxis: NumericAxis(
            title: AxisTitle(text: 'Mood Score (%)'),
            maximum: 100,
          ),
          tooltipBehavior: TooltipBehavior(enable: true),
          series: <LineSeries<double, int>>[
            LineSeries<double, int>(
              dataSource: moodScores,
              xValueMapper: (value, index) => index + 1,
              // Conversation index
              yValueMapper: (value, _) => value * 100,
              // Convert to percentage
              name: "General Mood Score",
              markerSettings: const MarkerSettings(isVisible: true),
              dataLabelSettings: const DataLabelSettings(isVisible: true),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildSymptomGraph(String symptom, List<double> data) {
    return Container(
      height: 40, // Reduced height
      width: 40,
      padding: const EdgeInsets.all(8.0),
      child: SfCartesianChart(
        title: ChartTitle(
            text: symptom, textStyle: const TextStyle(fontSize: 18)),
        primaryXAxis: NumericAxis(
          title: AxisTitle(
              text: 'Session', textStyle: const TextStyle(fontSize: 16)),
          minimum: 1,

        ),
        primaryYAxis: NumericAxis(
          title: AxisTitle(
              text: 'Score (%)', textStyle: const TextStyle(fontSize: 16)),
          maximum: 100,
        ),
        tooltipBehavior: TooltipBehavior(enable: true),
        series: <LineSeries<double, int>>[
          LineSeries<double, int>(
            dataSource: data,
            xValueMapper: (value, index) => index + 1,
            yValueMapper: (value, _) => value,
            markerSettings: const MarkerSettings(isVisible: true),
            name: symptom,
            dataLabelSettings: const DataLabelSettings(isVisible: true),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Symptom Plots")),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        child: Column(
          children: [
            // General Mood Score Graph
            if (_generalMoodScores.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: _buildGeneralMoodGraph(_generalMoodScores),
              ),
            // Symptom Graphs in Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 4,
              crossAxisSpacing: 30,
              mainAxisSpacing: 30,
              children: _symptomData.entries
                  .map((entry) =>
                  Card(
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: _buildSymptomGraph(entry.key, entry.value),
                    ),
                  ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}
